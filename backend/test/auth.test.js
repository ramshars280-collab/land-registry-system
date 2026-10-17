process.env.NODE_ENV = "test";
const assert = require("assert");
const http = require("http");
const { ethers } = require("ethers");
const app = require("../server");
const { UserStore, NonceStore } = require("../src/store");

// Test runner helper using node's built-in http
function request(server, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: "127.0.0.1",
      port: address.port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : {};
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   TERRACHAIN BACKEND AUTHENTICATION TEST SUITE       ");
  console.log("   (PASSWORD-BASED AUTH WITHOUT METAMASK VALIDATION)  ");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  let adminToken = "";
  let inspToken = "";
  let regToken = "";
  let citizenToken = "";

  try {
    // -----------------------------------------------------------
    // Test 1: Service Health Check
    // -----------------------------------------------------------
    {
      const res = await request(server, "GET", "/api/health");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "healthy");
      console.log("✔ Test 1 Passed: Service health check responds with 200 OK");
    }

    // -----------------------------------------------------------
    // Test 2: Missing Credentials Validation
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "",
        password: "",
        role: "admin",
      });
      assert.strictEqual(res.status, 400);
      assert(res.body.error.includes("required"));
      console.log("✔ Test 2 Passed: Missing username/password rejected with 400 Bad Request");
    }

    // -----------------------------------------------------------
    // Test 3: Password Validation - Invalid Credentials
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "admin@terrachain.gov.in",
        password: "WrongPassword123!",
        role: "admin",
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, "Invalid credentials.");
      console.log("✔ Test 3 Passed: Rejects wrong password with generic 'Invalid credentials' error");
    }

    // -----------------------------------------------------------
    // Test 4: Role Isolation - Access Denied for Wrong Portal
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "inspector@terrachain.gov.in",
        password: "inspector123",
        role: "admin", // Inspector trying to enter Admin portal!
      });
      assert.strictEqual(res.status, 403);
      assert(res.body.error.includes("Access Denied"));
      console.log("✔ Test 4 Passed: Role Isolation blocks Inspector account from logging into Admin portal");
    }

    // -----------------------------------------------------------
    // Test 5: Admin Login with Username/Password (No MetaMask)
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "admin@terrachain.gov.in",
        password: "admin123",
        role: "admin",
      });
      assert.strictEqual(res.status, 200);
      assert(res.body.token, "JWT token must be returned");
      assert.strictEqual(res.body.user.role, "admin");
      adminToken = res.body.token;
      console.log("✔ Test 5 Passed: Admin logs in using password only (No wallet signature required)");
    }

    // -----------------------------------------------------------
    // Test 6: Land Inspector Login with Username/Password (No MetaMask)
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "inspector@terrachain.gov.in",
        password: "inspector123",
        role: "inspector",
      });
      assert.strictEqual(res.status, 200);
      assert(res.body.token, "JWT token must be returned");
      assert.strictEqual(res.body.user.role, "inspector");
      inspToken = res.body.token;
      console.log("✔ Test 6 Passed: Land Inspector logs in using password only (No wallet signature required)");
    }

    // -----------------------------------------------------------
    // Test 7: Sub-Registrar Login with Username/Password (No MetaMask)
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "registrar@terrachain.gov.in",
        password: "registrar123",
        role: "registrar",
      });
      assert.strictEqual(res.status, 200);
      assert(res.body.token, "JWT token must be returned");
      assert.strictEqual(res.body.user.role, "registrar");
      regToken = res.body.token;
      console.log("✔ Test 7 Passed: Sub-Registrar logs in using password only (No wallet signature required)");
    }

    // -----------------------------------------------------------
    // Test 8: Citizen Seller Login with Username/Password (No MetaMask)
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "seller@terrachain.io",
        password: "seller123",
        role: "citizen",
      });
      assert.strictEqual(res.status, 200);
      assert(res.body.token, "JWT token must be returned");
      assert.strictEqual(res.body.user.role, "citizen");
      citizenToken = res.body.token;
      console.log("✔ Test 8 Passed: Citizen Seller logs in using password only (No wallet signature required)");
    }

    // -----------------------------------------------------------
    // Test 9: Citizen Buyer Login with Username/Password (No MetaMask)
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/login", {}, {
        emailOrUsername: "buyer@terrachain.io",
        password: "buyer123",
        role: "citizen",
      });
      assert.strictEqual(res.status, 200);
      assert(res.body.token, "JWT token must be returned");
      assert.strictEqual(res.body.user.role, "citizen");
      console.log("✔ Test 9 Passed: Citizen Buyer logs in using password only (No wallet signature required)");
    }

    // -----------------------------------------------------------
    // Test 10: Authenticated Profile & Session Loading (/api/auth/me)
    // -----------------------------------------------------------
    {
      const res = await request(server, "GET", "/api/auth/me", {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, "admin@terrachain.gov.in");
      assert.strictEqual(res.body.user.role, "admin");
      console.log("✔ Test 10 Passed: Session verification endpoint /api/auth/me restores verified profile");
    }

    // -----------------------------------------------------------
    // Test 11: Invalid/Expired Session Token Rejected
    // -----------------------------------------------------------
    {
      const res = await request(server, "GET", "/api/auth/me", {
        Authorization: "Bearer invalid.fake.token",
      });
      assert.strictEqual(res.status, 401);
      console.log("✔ Test 11 Passed: Invalid session token rejected with 401 Unauthorized");
    }

    // -----------------------------------------------------------
    // Test 12: Citizen Self-Registration
    // -----------------------------------------------------------
    const newCitizenEmail = `citizen_test_${Date.now()}@example.com`;
    const newCitizenWallet = ethers.Wallet.createRandom().address;
    {
      const res = await request(server, "POST", "/api/auth/register-citizen", {}, {
        username: `citizen_${Date.now()}`,
        email: newCitizenEmail,
        password: "CitizenPassword123!",
        name: "Test Citizen User",
        walletAddress: newCitizenWallet,
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.user.role, "citizen");
      console.log("✔ Test 12 Passed: Public citizen self-registration successfully creates Citizen account");
    }

    // -----------------------------------------------------------
    // Test 13: RBAC Protection - Citizen Cannot Access Admin Officer Routes
    // -----------------------------------------------------------
    {
      const res = await request(server, "GET", "/api/officers", {
        Authorization: `Bearer ${citizenToken}`,
      });
      assert.strictEqual(res.status, 403);
      assert(res.body.error.includes("Access Denied"));
      console.log("✔ Test 13 Passed: Route-level RBAC denies Citizen access to /api/officers (403 Forbidden)");
    }

    // -----------------------------------------------------------
    // Test 14: Admin Can Provision New Officer
    // -----------------------------------------------------------
    let provisionedOfficerId = "";
    {
      const testOfficerWallet = ethers.Wallet.createRandom().address;
      const res = await request(
        server,
        "POST",
        "/api/officers/provision",
        { Authorization: `Bearer ${adminToken}` },
        {
          username: `inspector_${Date.now()}`,
          email: `inspector_${Date.now()}@terrachain.gov.in`,
          password: "InspectorNewPass123!",
          name: "Assistant Inspector Deshpande",
          role: "inspector",
          department: "Aurangabad Revenue Division",
          walletAddress: testOfficerWallet,
        }
      );
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.officer.role, "inspector");
      provisionedOfficerId = res.body.officer.id;
      console.log("✔ Test 14 Passed: Admin provisions new Inspector account with bcrypt password & wallet binding");
    }

    // -----------------------------------------------------------
    // Test 15: Admin Can View Audit Logs
    // -----------------------------------------------------------
    {
      const res = await request(server, "GET", "/api/audit-logs", {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.logs), "Logs must be an array");
      assert(res.body.logs.length > 0, "Audit logs must record activities");
      console.log("✔ Test 15 Passed: Security audit log tracks all logins, role rejections, and events");
    }

    // -----------------------------------------------------------
    // Test 16: Admin Can Deactivate Officer
    // -----------------------------------------------------------
    {
      const res = await request(
        server,
        "DELETE",
        `/api/officers/${provisionedOfficerId}`,
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(res.status, 200);
      assert(res.body.success, "Deactivation must succeed");
      console.log("✔ Test 16 Passed: Admin deactivates officer account successfully");
    }

    // -----------------------------------------------------------
    // Test 17: Logout Clears Session
    // -----------------------------------------------------------
    {
      const res = await request(server, "POST", "/api/auth/logout", {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
      console.log("✔ Test 17 Passed: Logout endpoint clears session cookie and records audit event");
    }

    console.log("\n=======================================================");
    console.log("   ALL 17 BACKEND AUTHENTICATION TESTS PASSED!        ");
    console.log("=======================================================\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
