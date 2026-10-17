const jwt = require("jsonwebtoken");
const { UserStore, AuditStore } = require("../store");

const JWT_SECRET = process.env.JWT_SECRET || "terrachain-secure-jwt-secret-key-change-in-prod-2025";

// Rate limiter state: Map<ipOrIdentifier, { attempts: number, lockUntil: number }>
const rateLimitMap = new Map();

// Rate limiter: Max 5 failed attempts per 15 minutes
function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const identifier = (req.body?.emailOrUsername || req.body?.email || "").toLowerCase().trim();
  const key = `${ip}:${identifier}`;

  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (record && record.lockUntil > now) {
    const remainingSec = Math.ceil((record.lockUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many login attempts. Account access temporarily locked. Please try again in ${remainingSec} seconds.`,
      retryAfter: remainingSec,
    });
  }

  // Attach rate limit record update helper
  req.recordFailedLogin = () => {
    const current = rateLimitMap.get(key) || { attempts: 0, lockUntil: 0 };
    current.attempts += 1;
    if (current.attempts >= 5) {
      current.lockUntil = now + 15 * 60 * 1000; // 15 minutes lockout
      AuditStore.log(
        "RATE_LIMIT_LOCKOUT",
        identifier || "unknown",
        identifier,
        { ip, attempts: current.attempts },
        ip
      );
    }
    rateLimitMap.set(key, current);
  };

  req.resetLoginRateLimit = () => {
    rateLimitMap.delete(key);
  };

  next();
}

// Authentication middleware verifying JWT session token
function authenticateToken(req, res, next) {
  let token = null;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.terrachain_session) {
    token = req.cookies.terrachain_session;
  }

  // 2. Check Authorization Bearer header fallback
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      error: "Authentication required. Please sign in through your role-specific portal.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = UserStore.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: "Authenticated user account no longer exists.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Session has expired or is invalid. Please sign in again.",
    });
  }
}

// Role authorization guard
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      AuditStore.log(
        "UNAUTHORIZED_ACCESS_ATTEMPT",
        req.user.email,
        req.user.role,
        { requestedPath: req.originalUrl, requiredRoles: allowedRoles },
        req.ip
      );

      return res.status(403).json({
        error: `Access Denied: Your verified role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
}

module.exports = {
  loginRateLimiter,
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
