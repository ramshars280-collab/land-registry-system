const { ethers } = require("ethers");
const path = require("path");
const { AuditStore } = require("../store");

// Hardhat standard local development accounts
const LOCAL_WALLET_KEYS = {
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Admin (Account #0)
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Inspector (Account #1)
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Registrar (Account #2)
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Citizen Seller (Account #3)
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Citizen Buyer (Account #4)
};

const RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";

function getContractInstance(signerOrProvider) {
  const config = require(path.resolve(__dirname, "../../../frontend/src/contracts/LandRegistryConfig.json"));
  return new ethers.Contract(config.address, config.abi, signerOrProvider);
}

function getSignerForUser(user) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const normalizedAddr = (user.walletAddress || "").toLowerCase();
  const privKey = LOCAL_WALLET_KEYS[normalizedAddr];

  if (!privKey) {
    // Fallback: If role is admin, use admin key; inspector -> inspector key, etc.
    if (user.role === "admin") {
      return new ethers.Wallet(LOCAL_WALLET_KEYS["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"], provider);
    }
    if (user.role === "inspector") {
      return new ethers.Wallet(LOCAL_WALLET_KEYS["0x70997970c51812dc3a010c7d01b50e0d17dc79c8"], provider);
    }
    if (user.role === "registrar") {
      return new ethers.Wallet(LOCAL_WALLET_KEYS["0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"], provider);
    }
    // Default citizen
    return new ethers.Wallet(LOCAL_WALLET_KEYS["0x90f79bf6eb2c4f870365e785982e1f101e93b906"], provider);
  }

  return new ethers.Wallet(privKey, provider);
}

/**
 * 1. Citizen registers a new parcel on-chain
 */
async function registerLandOnChain(req, res) {
  try {
    const { physicalAddress, areaSqFt, priceEth, ipfsHash } = req.body;

    if (!physicalAddress || !areaSqFt || !ipfsHash) {
      return res.status(400).json({ error: "Physical address, area (sq ft), and deed document CID are required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    const area = Number(areaSqFt);
    const priceWei = priceEth ? ethers.parseEther(String(priceEth)) : 0n;

    const tx = await contract.registerLand(physicalAddress.trim(), area, priceWei, ipfsHash.trim());
    const receipt = await tx.wait();

    // Find LandRegistered event
    let landId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "LandRegistered") {
          landId = Number(parsed.args[0]);
          break;
        }
      } catch (e) {
        // Skip unparseable log
      }
    }

    AuditStore.log("LAND_REGISTERED_ON_CHAIN", req.user.email, signer.address, {
      landId,
      txHash: tx.hash,
      physicalAddress,
      area,
    }, req.ip);

    return res.status(201).json({
      success: true,
      landId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      signerAddress: signer.address,
      message: `Parcel registered successfully on blockchain.`,
    });
  } catch (err) {
    console.error("Blockchain register error:", err);
    return res.status(500).json({ error: "Smart contract registration reverted: " + (err.shortMessage || err.message) });
  }
}

/**
 * 2. Inspector verifies land on-chain
 */
async function verifyLandOnChain(req, res) {
  try {
    const landId = Number(req.params.id);
    if (!landId || isNaN(landId)) {
      return res.status(400).json({ error: "Valid numeric parcel ID is required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    const tx = await contract.verifyLand(landId);
    const receipt = await tx.wait();

    AuditStore.log("LAND_VERIFIED_ON_CHAIN", req.user.email, signer.address, {
      landId,
      txHash: tx.hash,
    }, req.ip);

    return res.json({
      success: true,
      landId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: `Parcel #${landId} successfully verified on-chain.`,
    });
  } catch (err) {
    console.error("Blockchain verify error:", err);
    return res.status(500).json({ error: "Verification failed on-chain: " + (err.shortMessage || err.message) });
  }
}

/**
 * 3. Registrar certifies title deed on-chain
 */
async function certifyTitleOnChain(req, res) {
  try {
    const landId = Number(req.params.id);
    if (!landId || isNaN(landId)) {
      return res.status(400).json({ error: "Valid numeric parcel ID is required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    const tx = await contract.certifyTitle(landId);
    const receipt = await tx.wait();

    AuditStore.log("TITLE_CERTIFIED_ON_CHAIN", req.user.email, signer.address, {
      landId,
      txHash: tx.hash,
    }, req.ip);

    return res.json({
      success: true,
      landId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: `Parcel #${landId} title deed certified by Sub-Registrar.`,
    });
  } catch (err) {
    console.error("Blockchain certify error:", err);
    return res.status(500).json({ error: "Title certification failed on-chain: " + (err.shortMessage || err.message) });
  }
}

/**
 * 4. Citizen lists land for sale on marketplace
 */
async function listLandOnChain(req, res) {
  try {
    const landId = Number(req.params.id);
    const { priceEth } = req.body;

    if (!landId || !priceEth || isNaN(priceEth) || Number(priceEth) <= 0) {
      return res.status(400).json({ error: "Valid parcel ID and positive price in ETH are required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    const priceWei = ethers.parseEther(String(priceEth));
    const tx = await contract.listForSale(landId, priceWei);
    const receipt = await tx.wait();

    AuditStore.log("LAND_LISTED_ON_CHAIN", req.user.email, signer.address, {
      landId,
      priceEth,
      txHash: tx.hash,
    }, req.ip);

    return res.json({
      success: true,
      landId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: `Parcel #${landId} listed on marketplace for ${priceEth} ETH.`,
    });
  } catch (err) {
    console.error("Blockchain list error:", err);
    return res.status(500).json({ error: "Listing failed on-chain: " + (err.shortMessage || err.message) });
  }
}

/**
 * 5. Citizen delists land from marketplace
 */
async function delistLandOnChain(req, res) {
  try {
    const landId = Number(req.params.id);
    if (!landId) {
      return res.status(400).json({ error: "Valid parcel ID is required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    const tx = await contract.delistLand(landId);
    const receipt = await tx.wait();

    AuditStore.log("LAND_DELISTED_ON_CHAIN", req.user.email, signer.address, {
      landId,
      txHash: tx.hash,
    }, req.ip);

    return res.json({
      success: true,
      landId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: `Parcel #${landId} delisted from marketplace.`,
    });
  } catch (err) {
    console.error("Blockchain delist error:", err);
    return res.status(500).json({ error: "Delisting failed on-chain: " + (err.shortMessage || err.message) });
  }
}

/**
 * 6. Citizen buys land with ETH
 */
async function buyLandOnChain(req, res) {
  try {
    const landId = Number(req.params.id);
    if (!landId) {
      return res.status(400).json({ error: "Valid parcel ID is required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    // Fetch asking price from contract
    const land = await contract.getLandDetails(landId);
    if (!land.isForSale) {
      return res.status(400).json({ error: "Parcel is not currently listed for sale." });
    }

    const priceWei = land.priceInWei;
    const tx = await contract.buyLand(landId, { value: priceWei });
    const receipt = await tx.wait();

    AuditStore.log("LAND_PURCHASED_ON_CHAIN", req.user.email, signer.address, {
      landId,
      priceWei: priceWei.toString(),
      txHash: tx.hash,
    }, req.ip);

    return res.json({
      success: true,
      landId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      newOwner: signer.address,
      message: `Parcel #${landId} successfully purchased! Title deed transferred.`,
    });
  } catch (err) {
    console.error("Blockchain buy error:", err);
    return res.status(500).json({ error: "Purchase failed on-chain: " + (err.shortMessage || err.message) });
  }
}

/**
 * 7. Admin adds an officer on-chain
 */
async function addOfficerOnChain(req, res) {
  try {
    const { officerAddress, role } = req.body;
    if (!officerAddress || !ethers.isAddress(officerAddress)) {
      return res.status(400).json({ error: "Valid officer Ethereum address required." });
    }

    const signer = getSignerForUser(req.user);
    const contract = getContractInstance(signer);

    let tx;
    if (role === "inspector") {
      tx = await contract.addInspector(officerAddress);
    } else if (role === "registrar") {
      tx = await contract.addRegistrar(officerAddress);
    } else {
      return res.status(400).json({ error: "Role must be 'inspector' or 'registrar'." });
    }

    const receipt = await tx.wait();

    AuditStore.log("OFFICER_ADDED_ON_CHAIN", req.user.email, signer.address, {
      officerAddress,
      role,
      txHash: tx.hash,
    }, req.ip);

    return res.json({
      success: true,
      officerAddress,
      role,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    console.error("Blockchain add officer error:", err);
    return res.status(500).json({ error: "Adding officer on-chain failed: " + (err.shortMessage || err.message) });
  }
}

module.exports = {
  registerLandOnChain,
  verifyLandOnChain,
  certifyTitleOnChain,
  listLandOnChain,
  delistLandOnChain,
  buyLandOnChain,
  addOfficerOnChain,
};
