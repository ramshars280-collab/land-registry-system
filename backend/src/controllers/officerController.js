const bcrypt = require("bcryptjs");
const { ethers } = require("ethers");
const { UserStore, AuditStore } = require("../store");

// 1. List All Provisioned Officers (Admin Only)
function listOfficers(req, res) {
  const users = UserStore.getAll();
  const officers = users
    .filter((u) => ["inspector", "registrar"].includes(u.role))
    .map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      name: u.name,
      role: u.role,
      department: u.department,
      walletAddress: u.walletAddress,
      createdAt: u.createdAt,
    }));

  return res.json({ officers });
}

// 2. Provision New Officer (Admin Only)
async function provisionOfficer(req, res) {
  const { username, email, password, name, role, department, walletAddress } = req.body;

  if (!username || !email || !password || !name || !role || !walletAddress) {
    return res.status(400).json({ error: "All fields are required to provision an officer." });
  }

  const cleanRole = role.toLowerCase().trim();
  if (!["inspector", "registrar"].includes(cleanRole)) {
    return res.status(400).json({ error: "Role must be either 'inspector' or 'registrar'." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Officer password must be at least 8 characters." });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: "A valid Ethereum wallet address is required." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUsername = username.toLowerCase().trim();
  const checksumAddress = ethers.getAddress(walletAddress);

  if (UserStore.findByEmailOrUsername(cleanEmail) || UserStore.findByEmailOrUsername(cleanUsername)) {
    return res.status(409).json({ error: "Email or username is already registered." });
  }

  const existingWallet = UserStore.findByWallet(checksumAddress);
  if (existingWallet) {
    return res.status(409).json({
      error: `Wallet address is already registered to ${existingWallet.name} (${existingWallet.role}).`,
    });
  }

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, 12);

  const newOfficer = {
    id: `officer-${cleanRole}-${Date.now()}`,
    username: cleanUsername,
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    role: cleanRole,
    department: department ? department.trim() : `Department of Land Records (${cleanRole.toUpperCase()})`,
    walletAddress: checksumAddress,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  UserStore.create(newOfficer);

  AuditStore.log(
    "OFFICER_PROVISIONED",
    req.user.email,
    newOfficer.email,
    {
      role: cleanRole,
      wallet: checksumAddress,
      provisionedBy: req.user.email,
    },
    req.ip
  );

  return res.status(201).json({
    success: true,
    message: `Officer account provisioned successfully. To authorize on-chain transactions, make sure to add their wallet (${checksumAddress}) in the smart contract via the Admin Console.`,
    officer: {
      id: newOfficer.id,
      email: newOfficer.email,
      username: newOfficer.username,
      name: newOfficer.name,
      role: newOfficer.role,
      department: newOfficer.department,
      walletAddress: newOfficer.walletAddress,
    },
  });
}

// 3. Deactivate / Delete Officer (Admin Only)
function deactivateOfficer(req, res) {
  const { id } = req.params;
  const officer = UserStore.findById(id);

  if (!officer) {
    return res.status(404).json({ error: "Officer account not found." });
  }

  if (officer.role === "admin") {
    return res.status(403).json({ error: "Master Administrator account cannot be deleted." });
  }

  UserStore.delete(id);

  AuditStore.log(
    "OFFICER_DEACTIVATED",
    req.user.email,
    officer.email,
    { role: officer.role, wallet: officer.walletAddress },
    req.ip
  );

  return res.json({
    success: true,
    message: `Officer ${officer.name} (${officer.role}) has been deactivated.`,
  });
}

// 4. Retrieve Security Audit Logs (Admin Only)
function getAuditLogs(req, res) {
  const logs = AuditStore.getAll();
  return res.json({ logs });
}

module.exports = {
  listOfficers,
  provisionOfficer,
  deactivateOfficer,
  getAuditLogs,
};
