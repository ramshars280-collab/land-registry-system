const assert = require("assert");

const BASE_URL = "http://localhost:5000/api";

async function runIntegrationSuite() {
  console.log("\n========================================================");
  console.log("   TERRACHAIN COMPLETE END-TO-END INTEGRATION TEST SUITE ");
  console.log("========================================================");

  // Helper for requests
  async function apiRequest(endpoint, method = "GET", body = null, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. AUTHENTICATION TESTS (WITHOUT METAMASK)
  console.log("\n--- TEST PHASE 1: PASSWORD AUTHENTICATION WITHOUT METAMASK ---");

  // A. Admin Login
  console.log("1.1 Admin login with username/password...");
  const adminLogin = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "admin@terrachain.gov.in",
    password: "admin123",
    role: "admin",
  });
  assert.strictEqual(adminLogin.status, 200, "Admin login should return 200");
  assert.strictEqual(adminLogin.data.success, true);
  const adminToken = adminLogin.data.token;
  console.log("    ✓ Admin authenticated successfully. Token received.");

  // B. Inspector Login
  console.log("1.2 Land Inspector login with username/password...");
  const inspLogin = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "inspector@terrachain.gov.in",
    password: "inspector123",
    role: "inspector",
  });
  assert.strictEqual(inspLogin.status, 200, "Inspector login should return 200");
  assert.strictEqual(inspLogin.data.success, true);
  const inspToken = inspLogin.data.token;
  console.log("    ✓ Inspector authenticated successfully. Token received.");

  // C. Sub-Registrar Login
  console.log("1.3 Sub-Registrar login with username/password...");
  const regLogin = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "registrar@terrachain.gov.in",
    password: "registrar123",
    role: "registrar",
  });
  assert.strictEqual(regLogin.status, 200, "Registrar login should return 200");
  assert.strictEqual(regLogin.data.success, true);
  const regToken = regLogin.data.token;
  console.log("    ✓ Sub-Registrar authenticated successfully. Token received.");

  // D. Citizen Seller Login
  console.log("1.4 Citizen Seller login with username/password...");
  const sellerLogin = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "seller@terrachain.io",
    password: "seller123",
    role: "citizen",
  });
  assert.strictEqual(sellerLogin.status, 200, "Seller login should return 200");
  const sellerToken = sellerLogin.data.token;
  console.log("    ✓ Citizen Seller authenticated successfully.");

  // E. Citizen Buyer Login
  console.log("1.5 Citizen Buyer login with username/password...");
  const buyerLogin = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "buyer@terrachain.io",
    password: "buyer123",
    role: "citizen",
  });
  assert.strictEqual(buyerLogin.status, 200, "Buyer login should return 200");
  const buyerToken = buyerLogin.data.token;
  console.log("    ✓ Citizen Buyer authenticated successfully.");

  // F. Invalid Credentials
  console.log("1.6 Invalid credentials rejected...");
  const invalidLogin = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "admin@terrachain.gov.in",
    password: "WRONG_PASSWORD",
    role: "admin",
  });
  assert.strictEqual(invalidLogin.status, 401, "Invalid password should return 401");
  console.log("    ✓ Bad password rejected with 401 Unauthorized.");

  // G. Cross-Role Access Blocked
  console.log("1.7 Cross-role login blocked (Citizen attempting to log into Admin portal)...");
  const crossRole = await apiRequest("/auth/login", "POST", {
    emailOrUsername: "seller@terrachain.io",
    password: "seller123",
    role: "admin",
  });
  assert.strictEqual(crossRole.status, 403, "Role mismatch should return 403");
  console.log("    ✓ Cross-role access blocked with 403 Forbidden.");

  // 2. DOCUMENT STORAGE ADAPTER TESTS
  console.log("\n--- TEST PHASE 2: DOCUMENT STORAGE ADAPTER ---");
  console.log("2.1 Upload deed PDF to local cadastral document adapter...");
  const samplePdfBase64 = Buffer.from("%PDF-1.4 sample title deed content").toString("base64");
  const uploadRes = await apiRequest("/storage/upload", "POST", {
    filename: "Integration_Deed_Test.pdf",
    mimeType: "application/pdf",
    base64Data: samplePdfBase64,
  }, sellerToken);
  assert.strictEqual(uploadRes.status, 201, "Upload should return 201");
  const deedCid = uploadRes.data.cid;
  console.log(`    ✓ Document stored successfully. CID: ${deedCid}`);

  // Retrieve Document
  console.log("2.2 Retrieve deed document by CID...");
  const fetchDoc = await fetch(`${BASE_URL}/storage/document/${deedCid}`);
  assert.strictEqual(fetchDoc.status, 200, "Document should be retrievable");
  console.log(`    ✓ Document retrieved successfully (HTTP 200).`);

  // 3. COMPLETE BLOCKCHAIN WORKFLOW (SERVER-MEDIATED LOCAL SIGNING)
  console.log("\n--- TEST PHASE 3: ON-CHAIN TRANSACTION WORKFLOW ---");

  // Step A: Citizen registers land on-chain
  console.log("3.1 Citizen Seller registers new parcel on-chain...");
  const regLandRes = await apiRequest("/blockchain/land/register", "POST", {
    physicalAddress: "Plot #99, Integration Test Sector, Chh. Sambhajinagar",
    areaSqFt: 5000,
    priceEth: "3.5",
    ipfsHash: deedCid,
  }, sellerToken);
  assert.strictEqual(regLandRes.status, 201, "Land registration should succeed on-chain");
  const newLandId = regLandRes.data.landId;
  console.log(`    ✓ Parcel #${newLandId} registered on-chain. TX: ${regLandRes.data.txHash.slice(0, 18)}...`);

  // Step B: Unauthorized verification attempt
  console.log("3.2 Unauthorized verification attempt (Citizen attempting to verify)...");
  const unauthVerify = await apiRequest(`/blockchain/land/${newLandId}/verify`, "POST", {}, sellerToken);
  assert.strictEqual(unauthVerify.status, 403, "Citizen should be forbidden from verifying land");
  console.log("    ✓ Unauthorized verification rejected with 403 Forbidden.");

  // Step C: Inspector verifies land on-chain
  console.log(`3.3 Inspector verifies Parcel #${newLandId} on-chain...`);
  const verifyRes = await apiRequest(`/blockchain/land/${newLandId}/verify`, "POST", {}, inspToken);
  assert.strictEqual(verifyRes.status, 200, "Inspector verification should succeed on-chain");
  console.log(`    ✓ Parcel #${newLandId} verified on-chain. TX: ${verifyRes.data.txHash.slice(0, 18)}...`);

  // Step D: Citizen lists land for sale on marketplace
  console.log(`3.4 Citizen Seller lists Parcel #${newLandId} for sale (3.5 ETH)...`);
  const listRes = await apiRequest(`/blockchain/land/${newLandId}/list`, "POST", {
    priceEth: "3.5",
  }, sellerToken);
  assert.strictEqual(listRes.status, 200, "Listing should succeed on-chain");
  console.log(`    ✓ Parcel #${newLandId} listed on marketplace. TX: ${listRes.data.txHash.slice(0, 18)}...`);

  // Step E: Citizen Buyer purchases land with ETH
  console.log(`3.5 Citizen Buyer purchases Parcel #${newLandId} with ETH...`);
  const buyRes = await apiRequest(`/blockchain/land/${newLandId}/buy`, "POST", {}, buyerToken);
  assert.strictEqual(buyRes.status, 200, "Purchase should succeed on-chain");
  console.log(`    ✓ Parcel #${newLandId} purchased! Title deed transferred on-chain.`);
  console.log(`      New Owner Address: ${buyRes.data.newOwner}`);

  // Step F: Verify title deed certification by Sub-Registrar
  console.log(`3.6 Sub-Registrar certifies Parcel #${newLandId} title deed...`);
  const certifyRes = await apiRequest(`/blockchain/land/${newLandId}/certify`, "POST", {}, regToken);
  assert.strictEqual(certifyRes.status, 200, "Registrar certification should succeed on-chain");
  console.log(`    ✓ Parcel #${newLandId} legally certified on-chain. TX: ${certifyRes.data.txHash.slice(0, 18)}...`);

  console.log("\n========================================================");
  console.log(">>> [ALL 12/12 END-TO-END INTEGRATION TESTS PASSED!] <<<");
  console.log("========================================================\n");
}

runIntegrationSuite().catch((err) => {
  console.error("\n❌ Integration Test Suite Failed:", err);
  process.exit(1);
});
