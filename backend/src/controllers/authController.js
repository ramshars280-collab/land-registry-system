const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const { UserStore, NonceStore, AuditStore } = require("../store");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// Allowed application roles
const VALID_ROLES = ["admin", "inspector", "registrar", "citizen"];

// 1. Issue short-lived cryptographic nonce
function getNonce(req, res) {
  const { walletAddress, role } = req.body;

  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: "A valid Ethereum wallet address is required." });
  }

  const cleanRole = (role || "").toLowerCase().trim();
  if (!VALID_ROLES.includes(cleanRole)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  const nonce = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const checksumAddress = ethers.getAddress(walletAddress);

  // Formulate unambiguous signature message (EIP-191 personal_sign standard)
  const message = [
    "TerraChain Security Authentication",
    "---------------------------------",
    `Role: ${cleanRole}`,
    `Wallet: ${checksumAddress}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`,
    "Domain: terrachain.gov.in",
    "Statement: Sign this one-time challenge to authenticate your wallet ownership.",
  ].join("\n");

  NonceStore.create(nonce, checksumAddress, cleanRole);

  return res.json({
    nonce,
    message,
    walletAddress: checksumAddress,
    role: cleanRole,
    expiresInSeconds: 300,
  });
}

// 2. Authenticate User (Pure Password-Based Authentication with Strict Role Isolation)
async function login(req, res) {
  const { emailOrUsername, password, role } = req.body;

  // Input validation
  if (!emailOrUsername || !password || !role) {
    if (req.recordFailedLogin) req.recordFailedLogin();
    return res.status(400).json({
      error: "Username/Email, password, and portal role are required.",
    });
  }

  const requestedRole = role.toLowerCase().trim();
  if (!VALID_ROLES.includes(requestedRole)) {
    if (req.recordFailedLogin) req.recordFailedLogin();
    return res.status(400).json({ error: "Invalid role requested." });
  }

  // 1. Find user in persistent store
  const user = UserStore.findByEmailOrUsername(emailOrUsername);
  if (!user) {
    if (req.recordFailedLogin) req.recordFailedLogin();
    return res.status(401).json({ error: "Invalid credentials." });
  }

  // 2. Validate password with bcrypt
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    if (req.recordFailedLogin) req.recordFailedLogin();
    return res.status(401).json({ error: "Invalid credentials." });
  }

  // 3. Enforce Role Isolation (User must possess the role corresponding to the portal)
  if (user.role.toLowerCase() !== requestedRole) {
    if (req.recordFailedLogin) req.recordFailedLogin();
    AuditStore.log(
      "ROLE_MISMATCH_LOGIN_BLOCKED",
      user.email,
      requestedRole,
      { actualRole: user.role, attemptedRole: requestedRole },
      req.ip
    );
    return res.status(403).json({
      error: `Access Denied: Your account is registered as '${user.role}' and cannot access the ${requestedRole.toUpperCase()} portal.`,
    });
  }

  // 4. Issue JWT session token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      walletAddress: user.walletAddress,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  // Set secure HTTP-only session cookie
  res.cookie("terrachain_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: "/",
  });

  // Reset rate limit on success
  if (req.resetLoginRateLimit) req.resetLoginRateLimit();

  AuditStore.log(
    "USER_LOGIN_SUCCESS",
    user.email,
    user.role,
    { wallet: user.walletAddress },
    req.ip
  );

  return res.json({
    success: true,
    token, // Provided for Authorization header fallback in testing / environments without cookies
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      walletAddress: user.walletAddress,
    },
  });
}

// 3. Citizen Self-Registration (Strictly for Citizen role only)
async function registerCitizen(req, res) {
  const { username, email, password, name, walletAddress } = req.body;

  if (!username || !email || !password || !name || !walletAddress) {
    return res.status(400).json({ error: "All fields are required for registration." });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: "A valid Ethereum wallet address is required." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUsername = username.toLowerCase().trim();
  const checksumAddress = ethers.getAddress(walletAddress);

  // Check uniqueness
  if (UserStore.findByEmailOrUsername(cleanEmail) || UserStore.findByEmailOrUsername(cleanUsername)) {
    return res.status(409).json({ error: "Email or username is already registered." });
  }

  const existingWallet = UserStore.findByWallet(checksumAddress);
  if (existingWallet) {
    return res.status(409).json({ error: "This wallet address is already linked to another account." });
  }

  // Hash password with bcrypt (Cost 12)
  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = {
    id: `citizen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username: cleanUsername,
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    role: "citizen", // STRICTLY FORCED to citizen role
    department: "Citizen Landholder / Real Estate Participant",
    walletAddress: checksumAddress,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  UserStore.create(newUser);

  AuditStore.log("CITIZEN_REGISTERED", cleanEmail, "citizen", { wallet: checksumAddress }, req.ip);

  return res.status(201).json({
    success: true,
    message: "Citizen account successfully created. You may now log in to the Citizen Portal.",
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      walletAddress: newUser.walletAddress,
    },
  });
}

// 4. Session Verification (Get current authenticated user)
function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "No active session." });
  }
  return res.json({ user: req.user });
}

// 5. Logout
function logout(req, res) {
  res.clearCookie("terrachain_session", { path: "/" });
  if (req.user) {
    AuditStore.log("USER_LOGOUT", req.user.email, req.user.role, {}, req.ip);
  }
  return res.json({ success: true, message: "Logged out successfully." });
}

module.exports = {
  getNonce,
  login,
  registerCitizen,
  getMe,
  logout,
};
