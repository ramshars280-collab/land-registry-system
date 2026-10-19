const hre = require('hardhat');
const config = require('../../frontend/src/contracts/LandRegistryConfig.json');

async function main() {
  const [admin, inspector] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt('LandRegistry', config.address);

  console.log('--- Test: Inspector calls verifyLand on Parcel #1 (already verified) ---');
  try {
    await contract.connect(inspector).verifyLand.estimateGas(1);
    console.log('UNEXPECTED SUCCESS');
  } catch (err) {
    console.log('EXPECTED REVERT:', err.message);
  }

  console.log('\n--- Test: Admin calls verifyLand on Parcel #1 (already verified) ---');
  try {
    await contract.connect(admin).verifyLand.estimateGas(1);
    console.log('UNEXPECTED SUCCESS');
  } catch (err) {
    console.log('EXPECTED REVERT:', err.message);
  }
}

main().catch(console.error);
