const hre = require('hardhat');
const config = require('../../frontend/src/contracts/LandRegistryConfig.json');

async function main() {
  const [admin, inspector, registrar, seller, buyer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt('LandRegistry', config.address);

  console.log('Testing Accounts:');
  console.log('Admin:    ', admin.address);
  console.log('Inspector:', inspector.address);
  console.log('Registrar:', registrar.address);
  console.log('Seller:   ', seller.address);
  console.log('Buyer:    ', buyer.address);

  // Test 1: Seller (Citizen) attempts verifyLand on Parcel #4 (unverified)
  console.log('\n--- Test 1: Citizen (Seller) attempts verifyLand(4) ---');
  try {
    await contract.connect(seller).verifyLand.estimateGas(4);
    console.log('UNEXPECTED SUCCESS: Citizen was allowed to verify!');
  } catch (err) {
    console.log('EXPECTED REVERT:', err.message);
  }

  // Test 2: Seller (Citizen) attempts certifyTitle on Parcel #1 (verified)
  console.log('\n--- Test 2: Citizen (Seller) attempts certifyTitle(1) ---');
  try {
    await contract.connect(seller).certifyTitle.estimateGas(1);
    console.log('UNEXPECTED SUCCESS: Citizen was allowed to certify!');
  } catch (err) {
    console.log('EXPECTED REVERT:', err.message);
  }

  // Test 3: Authorized Inspector calls verifyLand on Parcel #4
  console.log('\n--- Test 3: Authorized Inspector calls verifyLand(4) ---');
  try {
    const gas = await contract.connect(inspector).verifyLand.estimateGas(4);
    console.log('SUCCESS: Inspector estimated gas:', gas.toString());
  } catch (err) {
    console.log('FAILED:', err.message);
  }

  // Test 4: Authorized Registrar calls certifyTitle on Parcel #1
  console.log('\n--- Test 4: Authorized Registrar calls certifyTitle(1) ---');
  try {
    const gas = await contract.connect(registrar).certifyTitle.estimateGas(1);
    console.log('SUCCESS: Registrar estimated gas:', gas.toString());
  } catch (err) {
    console.log('FAILED:', err.message);
  }
}

main().catch(console.error);
