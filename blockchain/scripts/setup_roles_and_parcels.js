const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n========================================================");
  console.log("   TERRACHAIN: ROLE SYNCHRONIZATION & SEEDING PIPELINE  ");
  console.log("========================================================");

  const configPath = path.join(__dirname, "../../frontend/src/contracts/LandRegistryConfig.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const [admin, seller, buyer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("LandRegistry", config.address, admin);

  const registrarWallet = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
  const inspectorWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  console.log(`Smart Contract   : ${config.address}`);
  console.log(`Admin Signer     : ${admin.address}`);
  console.log(`Sub-Registrar    : ${registrarWallet}`);
  console.log(`Land Inspector   : ${inspectorWallet}\n`);

  // 1. Authorize Sub-Registrar
  console.log("--- 1. Authorizing Sub-Registrar (0x23618...) ---");
  const isReg1 = await contract.isRegistrar(registrarWallet);
  if (!isReg1) {
    const tx = await contract.addRegistrar(registrarWallet);
    await tx.wait();
    console.log(`✓ Granted isRegistrar role to ${registrarWallet}`);
  } else {
    console.log(`✓ ${registrarWallet} is already an authorized Registrar.`);
  }

  // Grant Inspector role as well for seamless testing
  const isInsp1 = await contract.isInspector(registrarWallet);
  if (!isInsp1) {
    const tx = await contract.addInspector(registrarWallet);
    await tx.wait();
    console.log(`✓ Granted isInspector role to ${registrarWallet}`);
  }

  // 2. Authorize Land Inspector (0x70997...)
  console.log("\n--- 2. Authorizing Land Inspector (0x70997...) ---");
  const isInsp2 = await contract.isInspector(inspectorWallet);
  if (!isInsp2) {
    const tx = await contract.addInspector(inspectorWallet);
    await tx.wait();
    console.log(`✓ Granted isInspector role to ${inspectorWallet}`);
  } else {
    console.log(`✓ ${inspectorWallet} is already an authorized Inspector.`);
  }

  // Grant Registrar role as well for seamless testing
  const isReg2 = await contract.isRegistrar(inspectorWallet);
  if (!isReg2) {
    const tx = await contract.addRegistrar(inspectorWallet);
    await tx.wait();
    console.log(`✓ Granted isRegistrar role to ${inspectorWallet}`);
  }

  // 3. Seed Cadastral Land Inventory
  const totalLands = Number(await contract.getTotalLands());
  console.log(`\n--- 3. Checking On-Chain Land Inventory (Current: ${totalLands}) ---`);

  if (totalLands === 0) {
    console.log("Seeding sample land records across all verification stages...\n");

    const sellerContract = contract.connect(seller);

    // Parcel #1: Pending Inspector Verification
    console.log("Registering Parcel #1 (Pending Inspector Verification)...");
    const tx1 = await sellerContract.registerLand(
      "Plot 104, IT Park Zone, CIDCO Sector 22, Chh. Sambhajinagar",
      3200,
      hre.ethers.parseEther("2.5"),
      "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
    );
    await tx1.wait();
    console.log("✓ Parcel #1 registered (Unverified, Unlisted)");

    // Parcel #2: Verified by Inspector -> Ready for Sub-Registrar Title Certification
    console.log("Registering Parcel #2 (To be verified by Inspector)...");
    const tx2 = await sellerContract.registerLand(
      "Plot 42, Green Valley Commercial Hub, Jalna Road, Chh. Sambhajinagar",
      5400,
      hre.ethers.parseEther("4.8"),
      "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx"
    );
    await tx2.wait();

    // Verify Parcel #2
    const verifyTx = await contract.verifyLand(2);
    await verifyTx.wait();
    console.log("✓ Parcel #2 verified by Inspector! (Now awaiting Sub-Registrar Endorsement)");

    // Parcel #3: Verified & Certified -> Listed on Marketplace
    console.log("Registering Parcel #3 (Fully certified & listed for sale)...");
    const tx3 = await sellerContract.registerLand(
      "Survey #78/B, Shendra MIDC Industrial Area, Chh. Sambhajinagar",
      8600,
      hre.ethers.parseEther("7.5"),
      "QmaiszDgBzPgnAM32FXMhPSc6nBsWFNetJuUGMTMTqmC5A"
    );
    await tx3.wait();

    // Verify #3
    await (await contract.verifyLand(3)).wait();
    // Certify #3
    await (await contract.certifyTitle(3)).wait();
    // List #3
    await (await sellerContract.listForSale(3, hre.ethers.parseEther("7.5"))).wait();
    console.log("✓ Parcel #3 registered, verified, certified, and listed for sale!");
  }

  const finalTotal = await contract.getTotalLands();
  console.log(`\n========================================================`);
  console.log(`>>> [SUCCESS] All Roles & Data Configured! Total Parcels: ${finalTotal}`);
  console.log(`========================================================\n`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
