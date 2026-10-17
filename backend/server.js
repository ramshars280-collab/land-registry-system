require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const {
  loginRateLimiter,
  authenticateToken,
  requireRole,
} = require("./src/middleware/authMiddleware");

const {
  getNonce,
  login,
  registerCitizen,
  getMe,
  logout,
} = require("./src/controllers/authController");

const {
  listOfficers,
  provisionOfficer,
  deactivateOfficer,
  getAuditLogs,
} = require("./src/controllers/officerController");

const {
  uploadDocument,
  getDocument,
} = require("./src/controllers/storageController");

const {
  registerLandOnChain,
  verifyLandOnChain,
  certifyTitleOnChain,
  listLandOnChain,
  delistLandOnChain,
  buyLandOnChain,
  addOfficerOnChain,
} = require("./src/controllers/blockchainController");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "TerraChain Authentication & RBAC Service",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post("/api/auth/nonce", getNonce);
app.post("/api/auth/login", loginRateLimiter, login);
app.post("/api/auth/register-citizen", registerCitizen);
app.get("/api/auth/me", authenticateToken, getMe);
app.post("/api/auth/logout", authenticateToken, logout);

// ==========================================
// DOCUMENT STORAGE ADAPTER (DEEDS & SURVEYS)
// ==========================================
app.post("/api/storage/upload", authenticateToken, uploadDocument);
app.get("/api/storage/document/:cid", getDocument);

// ==========================================
// LOCAL BLOCKCHAIN TRANSACTION ENGINE
// ==========================================
app.post("/api/blockchain/land/register", authenticateToken, requireRole("citizen"), registerLandOnChain);
app.post("/api/blockchain/land/:id/verify", authenticateToken, requireRole("inspector"), verifyLandOnChain);
app.post("/api/blockchain/land/:id/certify", authenticateToken, requireRole("registrar"), certifyTitleOnChain);
app.post("/api/blockchain/land/:id/list", authenticateToken, requireRole("citizen"), listLandOnChain);
app.post("/api/blockchain/land/:id/delist", authenticateToken, requireRole("citizen"), delistLandOnChain);
app.post("/api/blockchain/land/:id/buy", authenticateToken, requireRole("citizen"), buyLandOnChain);
app.post("/api/blockchain/officer/add", authenticateToken, requireRole("admin"), addOfficerOnChain);

// ==========================================
// PRIVILEGED OFFICER & AUDIT ROUTES (ADMIN ONLY)
// ==========================================
app.get("/api/officers", authenticateToken, requireRole("admin"), listOfficers);
app.post("/api/officers/provision", authenticateToken, requireRole("admin"), provisionOfficer);
app.delete("/api/officers/:id", authenticateToken, requireRole("admin"), deactivateOfficer);
app.get("/api/audit-logs", authenticateToken, requireRole("admin"), getAuditLogs);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error occurred." });
});

// Start Server if not imported by tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  TERRACHAIN RBAC & AUTHENTICATION SERVICE ACTIVE     `);
    console.log(`======================================================`);
    console.log(`Server listening on  : http://localhost:${PORT}`);
    console.log(`CORS Allowed Origin  : http://localhost:3000`);
    console.log(`Health Check         : http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
