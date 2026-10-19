const hre = require('hardhat');
const config = require('../../frontend/src/contracts/LandRegistryConfig.json');

async function main() {
  const contract = await hre.ethers.getContractAt('LandRegistry', config.address);

  const admin = await contract.admin();
  console.log('Contract Address:', config.address);
  console.log('Admin:', admin);

  const inspAddr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const regAddr = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f';

  console.log('isInspector(admin):', await contract.isInspector(admin));
  console.log('isRegistrar(admin):', await contract.isRegistrar(admin));
  console.log('isInspector(inspAddr):', await contract.isInspector(inspAddr));
  console.log('isRegistrar(regAddr):', await contract.isRegistrar(regAddr));

  const total = await contract.getTotalLands();
  console.log('Total Lands:', total.toString());

  for (let i = 1; i <= Number(total); i++) {
    const land = await contract.getLandDetails(i);
    console.log(`Land #${i}: id=${land.id}, owner=${land.currentOwner}, verified=${land.isVerified}, forSale=${land.isForSale}, price=${land.priceInWei}`);
  }
}

main().catch(console.error);
