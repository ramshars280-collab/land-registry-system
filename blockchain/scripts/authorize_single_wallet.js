const hre = require("hardhat");
const config = require("../../frontend/src/contracts/LandRegistryConfig.json");

/**
 * Utility script to authorize ANY MetaMask wallet address as BOTH
 * an authorized Land Inspector and Sub-Registrar on-chain.
 *
 * Usage:
 *   npx hardhat run scripts/authorize_single_wallet.js --network localhost
 *   (or specify WALLET=0x... npx hardhat run scripts/authorize_single_wallet.js --network localhost)
 */
async function main() {
  const targetWallet = process.env.WALLET || process.argv[2] || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  if (!hre.ethers.isAddress(targetWallet)) {
    console.error(`Invalid Ethereum address: "${targetWallet}"`);
    console.log("Usage: node scripts/authorize_single_wallet.js <0xYourMetaMaskAddress>");
    process.exit(1);
  }

  const checksum = hre.ethers.getAddress(targetWallet);
  const [admin] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("LandRegistry", config.address, admin);

  console.log("\n============================================================");
  console.log("   TERRACHAIN: SINGLE-WALLET DUAL-ROLE AUTHORIZATION        ");
  console.log("============================================================");
  console.log(`Target Wallet    : ${checksum}`);
  console.log(`Contract Address : ${config.address}`);
  console.log(`Admin Signer     : ${admin.address}\n`);

  // 1. Authorize Inspector
  const isInsp = await contract.isInspector(checksum);
  if (!isInsp) {
    const tx1 = await contract.addInspector(checksum);
    await tx1.wait();
    console.log(`✓ Granted LAND INSPECTOR role to ${checksum}`);
  } else {
    console.log(`✓ ${checksum} already has LAND INSPECTOR role on-chain.`);
  }

  // 2. Authorize Registrar
  const isReg = await contract.isRegistrar(checksum);
  if (!isReg) {
    const tx2 = await contract.addRegistrar(checksum);
    await tx2.wait();
    console.log(`✓ Granted SUB-REGISTRAR role to ${checksum}`);
  } else {
    console.log(`✓ ${checksum} already has SUB-REGISTRAR role on-chain.`);
  }

  console.log("\n>>> [SUCCESS] Your single MetaMask wallet is now authorized for BOTH Inspector & Registrar roles!");
  console.log("You can now sign verification and certification transactions with this single wallet.\n");
}

main().catch((err) => {
  console.error("Authorization failed:", err);
  process.exit(1);
});
