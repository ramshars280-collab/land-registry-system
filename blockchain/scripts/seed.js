const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n====================================================");
  console.log("   TERRACHAIN SAMPLE DATA & ROLE SEEDING PIPELINE   ");
  console.log("====================================================");

  const configPath = path.join(__dirname, "../../frontend/src/contracts/LandRegistryConfig.json");
  if (!fs.existsSync(configPath)) {
    console.error("Error: LandRegistryConfig.json not found. Run deploy script first.");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const [admin, inspector, registrar, seller, buyer] = await hre.ethers.getSigners();

  console.log(`Admin Signer     : ${admin.address}`);
  console.log(`Inspector Signer : ${inspector.address}`);
  console.log(`Registrar Signer : ${registrar.address}`);
  console.log(`Seller Signer    : ${seller.address}`);
  console.log(`Buyer Signer     : ${buyer.address}`);
  console.log(`Contract Target  : ${config.address}\n`);

  const contract = await hre.ethers.getContractAt("LandRegistry", config.address, admin);

  // 1. Authorize Inspector & Registrar roles on-chain
  console.log("1. Checking & synchronizing government officer roles on-chain...");
  const isInsp = await contract.isInspector(inspector.address);
  if (!isInsp) {
    const tx = await contract.addInspector(inspector.address);
    await tx.wait();
    console.log(`   + Added ${inspector.address} as authorized Land Inspector.`);
  } else {
    console.log(`   ✓ ${inspector.address} is already an authorized Land Inspector.`);
  }

  const isReg = await contract.isRegistrar(registrar.address);
  if (!isReg) {
    const tx = await contract.addRegistrar(registrar.address);
    await tx.wait();
    console.log(`   + Added ${registrar.address} as authorized Sub-Registrar.`);
  } else {
    console.log(`   ✓ ${registrar.address} is already an authorized Sub-Registrar.`);
  }

  // 2. Seed Sample Land Records if inventory is empty
  const total = Number(await contract.getTotalLands());
  console.log(`\n2. Current on-chain land inventory: ${total} parcels.`);

  if (total === 0) {
    console.log("   Seeding realistic sample cadastral parcels...");

    const sellerContract = contract.connect(seller);
    const inspectorContract = contract.connect(inspector);
    const registrarContract = contract.connect(registrar);

    // Parcel 1: Pending inspection
    console.log("   - Registering Parcel #1 (Pending Inspector verification)...");
    const tx1 = await sellerContract.registerLand(
      "Plot #42, CIDCO Commercial Sector 19, Chh. Sambhajinagar",
      4500,
      hre.ethers.parseEther("2.5"),
      "bafk-sample-deed-cidco-sector19-cadastral-record"
    );
    await tx1.wait();
    console.log("     ✓ Parcel #1 registered by Seller.");

    // Parcel 2: Verified & Listed for sale
    console.log("   - Registering Parcel #2 (Verified & Listed on Marketplace)...");
    const tx2 = await sellerContract.registerLand(
      "Plot #108, Jalna Industrial Expressway Corridor, Aurangabad",
      12000,
      hre.ethers.parseEther("4.8"),
      "bafk-sample-deed-jalna-expressway-industrial-title"
    );
    await tx2.wait();
    const vTx2 = await inspectorContract.verifyLand(2);
    await vTx2.wait();
    const lTx2 = await sellerContract.listForSale(2, hre.ethers.parseEther("4.8"));
    await lTx2.wait();
    console.log("     ✓ Parcel #2 registered, verified by Inspector, and listed on marketplace.");

    // Parcel 3: Certified by Sub-Registrar & Listed
    console.log("   - Registering Parcel #3 (Certified by Sub-Registrar & Listed)...");
    const tx3 = await sellerContract.registerLand(
      "Royal Palm Residency Villa Plot 7B, Beed Bypass Highway",
      3200,
      hre.ethers.parseEther("1.8"),
      "bafk-sample-deed-royal-palm-residency-villa7b-notary"
    );
    await tx3.wait();
    const vTx3 = await inspectorContract.verifyLand(3);
    await vTx3.wait();
    const cTx3 = await registrarContract.certifyTitle(3);
    await cTx3.wait();
    const lTx3 = await sellerContract.listForSale(3, hre.ethers.parseEther("1.8"));
    await lTx3.wait();
    console.log("     ✓ Parcel #3 registered, verified, certified, and listed on marketplace.");

    console.log("\n>>> [SUCCESS] All sample parcels successfully seeded on-chain!");
  } else {
    console.log("   ✓ Parcels already exist on-chain; skipping duplicate registration.");
  }

  console.log("====================================================\n");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
