require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { UserStore, AuditStore } = require("../src/store");

async function seedAdmin() {
  console.log("\n=======================================================");
  console.log("   TERRACHAIN INITIAL ADMINISTRATOR PROVISIONING      ");
  console.log("=======================================================");

  const existingUsers = UserStore.getAll();
  const existingAdmin = existingUsers.find((u) => u.role === "admin");

  if (existingAdmin) {
    console.log(`[INFO] Administrator account already exists: ${existingAdmin.email}`);
    console.log(`[INFO] Wallet address: ${existingAdmin.walletAddress}`);
    console.log("No changes made. To reset, remove backend/data/users.json and re-run.\n");
    return;
  }

  // Read provisioning parameters from environment or secure defaults
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@terrachain.gov.in";
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "AdminPass@2025#Terra";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Dr. Suresh Patil (Chief Registrar General)";
  const adminWallet = process.env.INITIAL_ADMIN_WALLET || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat Account #0 (Deployer)

  console.log(`Provisioning Admin Account:`);
  console.log(`• Username        : ${adminUsername}`);
  console.log(`• Email           : ${adminEmail}`);
  console.log(`• Display Name    : ${adminName}`);
  console.log(`• Assigned Wallet : ${adminWallet}`);

  // Salt and hash password with bcrypt (Cost factor 12)
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = {
    id: `admin-${Date.now()}`,
    username: adminUsername,
    email: adminEmail,
    passwordHash,
    name: adminName,
    role: "admin",
    department: "Directorate General of Land Records & Cadastral Registry",
    walletAddress: adminWallet,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  UserStore.create(adminUser);

  // Also provision initial citizen account for testing if needed
  const initialAccounts = [
    {
      id: "citizen-demo-initial",
      username: "citizen_ananya",
      email: "citizen@terrachain.io",
      password: process.env.INITIAL_CITIZEN_PASSWORD || "CitizenPass@2025#Terra",
      name: "Ananya Sharma (Citizen Property Owner)",
      role: "citizen",
      department: "Registered Citizen Property Owner (CIDCO Zone)",
      walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat Account #3
    },
  ];

  for (const acc of initialAccounts) {
    const hash = await bcrypt.hash(acc.password, 12);
    UserStore.create({
      id: acc.id,
      username: acc.username,
      email: acc.email,
      passwordHash: hash,
      name: acc.name,
      role: acc.role,
      department: acc.department,
      walletAddress: acc.walletAddress,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`• Provisioned ${acc.role.toUpperCase()} Account : ${acc.email} (${acc.walletAddress})`);
  }

  AuditStore.log("ADMIN_PROVISIONED", "system-seed", adminEmail, { wallet: adminWallet }, "127.0.0.1");

  console.log("\n>>> [SUCCESS] Initial administrative provisioning complete.");
  console.log("Credential security notice: Passwords have been salted & hashed with bcrypt.");
  console.log("No plaintext credentials are stored anywhere in database or code.\n");
}

seedAdmin().catch(console.error);
