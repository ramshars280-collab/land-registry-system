const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n========================================================");
  console.log(" TERRACHAIN: COMPLETE ACCOUNT & LAND RECORDS TRANSFER  ");
  console.log("========================================================");

  const configPath = path.join(__dirname, "../../frontend/src/contracts/LandRegistryConfig.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("LandRegistry", config.address, deployer);

  const accountRegistrar = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"; // Key: 0xdbda18...
  const accountInspector = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Key: 0x59c699...

  console.log(`Smart Contract Address : ${config.address}`);
  console.log(`Deployer / Admin       : ${deployer.address}`);
  console.log(`Sub-Registrar / Buyer  : ${accountRegistrar}`);
  console.log(`Inspector / Seller     : ${accountInspector}\n`);

  // 1. Configure Roles on Contract
  console.log("--- 1. Enforcing Roles on Chain ---");
  if (!(await contract.isRegistrar(accountRegistrar))) {
    await (await contract.addRegistrar(accountRegistrar)).wait();
    console.log(`✓ Granted isRegistrar to ${accountRegistrar}`);
  } else {
    console.log(`✓ ${accountRegistrar} already has isRegistrar.`);
  }

  if (!(await contract.isInspector(accountInspector))) {
    await (await contract.addInspector(accountInspector)).wait();
    console.log(`✓ Granted isInspector to ${accountInspector}`);
  } else {
    console.log(`✓ ${accountInspector} already has isInspector.`);
  }

  // Also cross-grant for maximum versatility
  if (!(await contract.isRegistrar(accountInspector))) {
    await (await contract.addRegistrar(accountInspector)).wait();
  }
  if (!(await contract.isInspector(accountRegistrar))) {
    await (await contract.addInspector(accountRegistrar)).wait();
  }

  // Ensure old registrar 0x3C44... does not have roles
  const oldReg = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  if (await contract.isRegistrar(oldReg)) {
    await (await contract.removeRegistrar(oldReg)).wait();
    console.log(`✓ Revoked isRegistrar from old account ${oldReg}`);
  }
  if (await contract.isInspector(oldReg)) {
    await (await contract.removeInspector(oldReg)).wait();
    console.log(`✓ Revoked isInspector from old account ${oldReg}`);
  }

  // 2. Register land parcels specifically owned by Account #8 (0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f)
  console.log("\n--- 2. Checking Lands Owned by Both Accounts ---");
  const totalLands = Number(await contract.getTotalLands());
  console.log(`Total on-chain parcels: ${totalLands}`);

  // Create signer for 0x23618...
  const regSigner = await hre.ethers.getSigner(accountRegistrar);
  const regContract = contract.connect(regSigner);

  // Check how many lands 0x23618... owns
  let regLandsCount = 0;
  for (let i = 1; i <= totalLands; i++) {
    const l = await contract.getLandDetails(i);
    if (l.currentOwner.toLowerCase() === accountRegistrar.toLowerCase()) {
      regLandsCount++;
    }
  }

  if (regLandsCount === 0) {
    console.log(`Registering new land parcels owned by ${accountRegistrar} (Account #8)...`);

    // Land owned by 0x23618...
    const txA = await regContract.registerLand(
      "Plot 505, Palm Beach Boulevard, Sector 18, Vashi, Navi Mumbai",
      4200,
      hre.ethers.parseEther("5.2"),
      "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
    );
    await txA.wait();
    const newId1 = Number(await contract.getTotalLands());
    console.log(`✓ Registered Land #${newId1} owned by ${accountRegistrar}`);

    // Verify and list
    await (await contract.verifyLand(newId1)).wait();
    await (await contract.certifyTitle(newId1)).wait();
    console.log(`✓ Land #${newId1} verified and title certified!`);

    // Another land owned by 0x23618...
    const txB = await regContract.registerLand(
      "Commercial Tower Unit 12B, Central Business District, Belapur",
      6800,
      hre.ethers.parseEther("8.0"),
      "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx"
    );
    await txB.wait();
    const newId2 = Number(await contract.getTotalLands());
    console.log(`✓ Registered Land #${newId2} owned by ${accountRegistrar}`);
    await (await contract.verifyLand(newId2)).wait();
    await (await contract.certifyTitle(newId2)).wait();
    await (await regContract.listForSale(newId2, hre.ethers.parseEther("8.0"))).wait();
    console.log(`✓ Land #${newId2} listed for sale on public marketplace!`);
  } else {
    console.log(`✓ ${accountRegistrar} already owns ${regLandsCount} parcel(s).`);
  }

  // 3. Print final report
  const finalTotal = Number(await contract.getTotalLands());
  console.log(`\n========================================================`);
  console.log(`FINAL LEDGER STATUS: Total Parcels = ${finalTotal}`);
  console.log(`========================================================`);
  for (let i = 1; i <= finalTotal; i++) {
    const l = await contract.getLandDetails(i);
    console.log(
      `Parcel #${i} | Owner: ${l.currentOwner} | Verified: ${l.isVerified} | ForSale: ${l.isForSale} | Price: ${hre.ethers.formatEther(l.priceInWei)} ETH | Address: ${l.physicalAddress.slice(0, 35)}...`
    );
  }
  console.log(`========================================================\n`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
