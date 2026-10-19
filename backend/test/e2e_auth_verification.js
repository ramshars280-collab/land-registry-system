const assert = require("assert");

const BASE_URL = "http://localhost:5000/api";

async function verifyAllAuthCases() {
  console.log("\n=================================================================");
  console.log("   TERRACHAIN COMPREHENSIVE AUTH & RBAC VERIFICATION SUITE       ");
  console.log("   (PURE PASSWORD-BASED LOGIN WITHOUT ANY METAMASK VALIDATION)   ");
  console.log("=================================================================\n");

  // Helper function to test login and session restoration
  async function testLoginFlow(role, credentials, expectedName, expectedRole) {
    console.log(`Testing [${role.toUpperCase()}] Login:`);
    console.log(`  Payload: { emailOrUsername: "${credentials.emailOrUsername}", role: "${role}" } (NO WALLET / NO SIGNATURE)`);

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailOrUsername: credentials.emailOrUsername,
        password: credentials.password,
        role: role,
      }),
    });

    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, `Login for ${role} should return HTTP 200`);
    assert.strictEqual(loginData.success, true);
    assert(loginData.token, "JWT token must be present in response");
    assert.strictEqual(loginData.user.role, expectedRole, `User role must match ${expectedRole}`);
    console.log(`  ✓ HTTP 200 OK: Successfully logged in as ${loginData.user.name} (${loginData.user.role})`);

    // Verify session restoration via /auth/me using Bearer token
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.user.email, loginData.user.email);
    console.log(`  ✓ Session Restored: /auth/me verified account without wallet prompt.\n`);

    return loginData.token;
  }

  // 1. Admin login
  const adminToken = await testLoginFlow(
    "admin",
    { emailOrUsername: "admin@terrachain.gov.in", password: "admin123" },
    "Dr. Suresh Patil",
    "admin"
  );

  // 2. Inspector login
  const inspectorToken = await testLoginFlow(
    "inspector",
    { emailOrUsername: "inspector@terrachain.gov.in", password: "inspector123" },
    "Officer Rajesh Patil",
    "inspector"
  );

  // 3. Registrar login
  const registrarToken = await testLoginFlow(
    "registrar",
    { emailOrUsername: "registrar@terrachain.gov.in", password: "registrar123" },
    "Sub-Registrar Meera",
    "registrar"
  );

  // 4. Citizen Seller login
  const sellerToken = await testLoginFlow(
    "citizen",
    { emailOrUsername: "seller@terrachain.io", password: "seller123" },
    "Ananya Sharma",
    "citizen"
  );

  // 5. Citizen Buyer login
  const buyerToken = await testLoginFlow(
    "citizen",
    { emailOrUsername: "buyer@terrachain.io", password: "buyer123" },
    "Vikram Malhotra",
    "citizen"
  );

  // 6. Test Incorrect Password Rejection
  console.log("Testing Incorrect Password Rejection:");
  const badPassRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: "admin@terrachain.gov.in",
      password: "incorrect_password_999",
      role: "admin",
    }),
  });
  assert.strictEqual(badPassRes.status, 401);
  const badPassData = await badPassRes.json();
  assert.strictEqual(badPassData.error, "Invalid credentials.");
  console.log("  ✓ HTTP 401 Unauthorized: Incorrect password correctly rejected.\n");

  // 7. Test Missing Credentials Rejection
  console.log("Testing Missing Credentials Rejection:");
  const missingRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: "",
      password: "",
      role: "admin",
    }),
  });
  assert.strictEqual(missingRes.status, 400);
  console.log("  ✓ HTTP 400 Bad Request: Missing credentials correctly rejected.\n");

  // 8. Test Cross-Role Dashboard / Route Isolation
  console.log("Testing Cross-Role Portal & Route Isolation:");

  // Inspector attempting to log into Admin Portal
  const crossLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: "inspector@terrachain.gov.in",
      password: "inspector123",
      role: "admin", // Wrong portal!
    }),
  });
  assert.strictEqual(crossLoginRes.status, 403);
  const crossLoginData = await crossLoginRes.json();
  assert(crossLoginData.error.includes("Access Denied"));
  console.log("  ✓ Inspector blocked from Admin portal (HTTP 403 Forbidden).");

  // Citizen attempting to access Admin API
  const citizenToAdmin = await fetch(`${BASE_URL}/officers`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert.strictEqual(citizenToAdmin.status, 403);
  console.log("  ✓ Citizen blocked from Admin /api/officers route (HTTP 403 Forbidden).");

  // Citizen attempting to verify land (Inspector route)
  const citizenVerify = await fetch(`${BASE_URL}/blockchain/land/1/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert.strictEqual(citizenVerify.status, 403);
  console.log("  ✓ Citizen blocked from Inspector verification route (HTTP 403 Forbidden).");

  // Inspector attempting to certify title (Registrar route)
  const inspCertify = await fetch(`${BASE_URL}/blockchain/land/1/certify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${inspectorToken}` },
  });
  assert.strictEqual(inspCertify.status, 403);
  console.log("  ✓ Inspector blocked from Sub-Registrar certification route (HTTP 403 Forbidden).\n");

  // 9. Test Invalid Session Token
  console.log("Testing Invalid Session Token Rejection:");
  const invalidSessionRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: "Bearer bogus.expired.jwt.token" },
  });
  assert.strictEqual(invalidSessionRes.status, 401);
  console.log("  ✓ HTTP 401 Unauthorized: Invalid session token rejected.\n");

  // 10. Test Logout
  console.log("Testing Logout Flow:");
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(logoutRes.status, 200);
  console.log("  ✓ HTTP 200 OK: Session logged out successfully.\n");

  console.log("=================================================================");
  console.log(">>> [ALL CHECKS PASSED: PASSWORD-BASED AUTH FULLY VERIFIED!] <<<");
  console.log("=================================================================\n");
}

verifyAllAuthCases().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
