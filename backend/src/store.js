const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory nonce cache with TTL
// Map<string, { nonce: string, walletAddress: string, role: string, expiresAt: number, used: boolean }>
const nonceStore = new Map();

// Helper to atomically read JSON
function readJSON(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), "utf8");
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultVal;
  }
}

// Helper to atomically write JSON
function writeJSON(filePath, data) {
  const tempFile = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempFile, filePath);
}

// User repository operations
const UserStore = {
  getAll() {
    return readJSON(USERS_FILE, []);
  },

  findById(id) {
    const users = this.getAll();
    return users.find((u) => u.id === id) || null;
  },

  findByEmailOrUsername(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const users = this.getAll();
    return (
      users.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          u.username.toLowerCase() === clean
      ) || null
    );
  },

  findByWallet(walletAddress) {
    if (!walletAddress) return null;
    const clean = walletAddress.trim().toLowerCase();
    const users = this.getAll();
    return users.find((u) => u.walletAddress.toLowerCase() === clean) || null;
  },

  create(user) {
    const users = this.getAll();
    users.push(user);
    writeJSON(USERS_FILE, users);
    return user;
  },

  update(id, updates) {
    const users = this.getAll();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
    writeJSON(USERS_FILE, users);
    return users[index];
  },

  delete(id) {
    const users = this.getAll();
    const filtered = users.filter((u) => u.id !== id);
    writeJSON(USERS_FILE, filtered);
    return true;
  },
};

// Nonce repository operations (5-minute TTL, single-use)
const NonceStore = {
  create(nonce, walletAddress, role) {
    const record = {
      nonce,
      walletAddress: walletAddress.toLowerCase(),
      role: role.toLowerCase(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      used: false,
    };
    nonceStore.set(nonce, record);
    return record;
  },

  get(nonce) {
    return nonceStore.get(nonce) || null;
  },

  markUsed(nonce) {
    const record = nonceStore.get(nonce);
    if (record) {
      record.used = true;
      nonceStore.set(nonce, record);
    }
  },

  cleanExpired() {
    const now = Date.now();
    for (const [nonce, record] of nonceStore.entries()) {
      if (record.expiresAt < now || record.used) {
        nonceStore.delete(nonce);
      }
    }
  },
};

// Periodic nonce cleanup every 5 minutes
setInterval(() => NonceStore.cleanExpired(), 5 * 60 * 1000).unref();

// Audit log repository operations
const AuditStore = {
  getAll() {
    return readJSON(AUDIT_FILE, []);
  },

  log(action, performedBy, targetUser, details = {}, ip = "") {
    const logs = this.getAll();
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      performedBy,
      targetUser,
      details,
      ip,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(entry);
    // Keep last 1000 logs
    if (logs.length > 1000) logs.length = 1000;
    writeJSON(AUDIT_FILE, logs);
    return entry;
  },
};

module.exports = {
  UserStore,
  NonceStore,
  AuditStore,
};
