const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n====================================================");
  console.log("   TERRACHAIN / LAND REGISTRY DEPLOYMENT PIPELINE   ");
  console.log("====================================================");
  console.log(`Network Target : ${hre.network.name} (Chain ID: ${hre.network.config.chainId || "31337"})`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer Admin : ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Funds : ${hre.ethers.formatEther(balance)} ETH\n`);

  // 1. Compile & Deploy LandRegistry
  console.log("Deploying LandRegistry smart contract...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();

  await landRegistry.waitForDeployment();
  const contractAddress = await landRegistry.getAddress();

  console.log(`\n>>> [SUCCESS] LandRegistry Deployed to: ${contractAddress}`);

  // 2. Export ABI & Contract Address to Frontend
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  try {
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
    }

    const artifactPath = path.join(
      __dirname,
      "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

      // Complete config object
      const configData = {
        address: contractAddress,
        network: hre.network.name,
        chainId: hre.network.config.chainId || 31337,
        deployedAt: new Date().toISOString(),
        abi: artifact.abi,
      };

      // Write LandRegistryConfig.json
      fs.writeFileSync(
        path.join(frontendContractsDir, "LandRegistryConfig.json"),
        JSON.stringify(configData, null, 2)
      );

      // Also write standalone LandRegistryABI.json for convenience
      fs.writeFileSync(
        path.join(frontendContractsDir, "LandRegistryABI.json"),
        JSON.stringify(artifact.abi, null, 2)
      );

      console.log(`>>> [SYNCED] Contract Address & ABI written to:`);
      console.log(`    • ${path.join(frontendContractsDir, "LandRegistryConfig.json")}`);
      console.log(`    • ${path.join(frontendContractsDir, "LandRegistryABI.json")}`);
    }
  } catch (err) {
    console.warn("Notice: Could not auto-sync contract config to frontend:", err.message);
  }

  console.log("====================================================\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
