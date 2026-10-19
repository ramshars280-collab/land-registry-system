const hre = require("hardhat");

async function main() {
  const mnemonic = "test test test test test test test test test test test junk";
  for (let i = 0; i < 20; i++) {
    const wallet = hre.ethers.HDNodeWallet.fromMnemonic(
      hre.ethers.Mnemonic.fromPhrase(mnemonic),
      `m/44'/60'/0'/0/${i}`
    );
    console.log(`Account #${i}: Address=${wallet.address} | PrivateKey=${wallet.privateKey}`);
  }
}

main().catch(console.error);
