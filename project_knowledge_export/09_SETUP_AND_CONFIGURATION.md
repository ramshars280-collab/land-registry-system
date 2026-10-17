# 09. Setup, Environment & Configuration Guide

## 1. Prerequisites & Dependencies

To execute, build, and test TerraChain, the host environment must have:
- **Node.js**: `v18.0.0` or higher (Tested on Node.js v20+).
- **npm**: `v9.0.0` or higher.
- **Git**: Installed and configured.
- **Web Browser**: Chrome, Brave, Edge, or Firefox with **MetaMask** wallet extension (optional if using built-in demo signers).

---

## 2. Environment Variables Configuration

Sensitive values must never be checked into version control. Environment variable templates are provided in both subdirectories:

### A. Blockchain Configuration: `blockchain/.env`
Create `blockchain/.env` based on `blockchain/.env.example`:

| Variable Name | Required For | Description | Secret? |
| :--- | :--- | :--- | :--- |
| `SEPOLIA_RPC_URL` | Sepolia Deployment | Alchemy / Infura HTTPS RPC endpoint | No (Public/Private endpoint) |
| `PRIVATE_KEY` | Sepolia Deployment | Deployer's Ethereum wallet hex private key | **YES - Highly Sensitive** |
| `ETHERSCAN_API_KEY` | Contract Verification | Etherscan API key for contract source code verification | **YES - Sensitive** |

> *Note: For local development (`localhost` / Hardhat network), `blockchain/.env` is not required as Hardhat generates 20 deterministic funded accounts automatically.*

### B. Frontend Configuration: `frontend/.env`
Create `frontend/.env` based on `frontend/.env.example`:

| Variable Name | Required For | Description | Secret? |
| :--- | :--- | :--- | :--- |
| `VITE_CONTRACT_ADDRESS` | Frontend Contract Binding | The deployed `LandRegistry` address (default: `0x5FbDB2315678afecb367f032d93F642f64180aa3`) | No |
| `VITE_PINATA_API_KEY` | Live IPFS Pinning | Pinata cloud API access key | **YES - Restricted** |
| `VITE_PINATA_SECRET_API_KEY` | Live IPFS Pinning | Pinata cloud secret API access key | **YES - Sensitive** |
| `VITE_PINATA_JWT` | Optional IPFS Pinning | Pinata Scoped JWT token | **YES - Sensitive** |

---

## 3. Step-by-Step Local Startup Instructions

### Step 1: Install Dependencies
From the repository root directory (`c:\LandBlock`):
```bash
# 1. Install root dependencies
npm install

# 2. Install blockchain hardhat dependencies
cd blockchain
npm install

# 3. Install backend authentication dependencies
cd ../backend
npm install
node scripts/seedAdmin.js

# 4. Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Start the Local Ethereum Blockchain Node
In your first terminal window:
```bash
cd blockchain
npx hardhat node
```
*Expected Output*: Starts an Ethereum JSON-RPC server on `http://127.0.0.1:8545/` with Chain ID `31337`. 20 pre-funded test accounts (10,000 ETH each) will be printed.

### Step 3: Deploy the Smart Contract
In your second terminal window:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*Expected Output*:
```
Deploying LandRegistry contract with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
LandRegistry deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Contract config saved to frontend/src/contracts/LandRegistryConfig.json
Contract ABI saved to frontend/src/contracts/LandRegistryABI.json
```

### Step 4: Start the Backend Authentication & RBAC Service
In your third terminal window:
```bash
cd backend
npm start
```
*Expected Output*:
```
======================================================
  TERRACHAIN RBAC & AUTHENTICATION SERVICE ACTIVE     
======================================================
Server listening on  : http://localhost:5000
CORS Allowed Origin  : http://localhost:3000
Health Check         : http://localhost:5000/api/health
======================================================
```

### Step 5: Launch the Frontend Development Server
In your fourth terminal window:
```bash
cd frontend
npm run dev
```
*Expected Output*:
```
  VITE v5.4.11  ready in 320 ms
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## 4. MetaMask Wallet Configuration (Optional)

If testing with MetaMask rather than the built-in demo signers:
1. Open MetaMask -> **Add Network** -> **Add a network manually**.
   - Network Name: `Hardhat Localhost`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
2. Import Hardhat test accounts using their private keys:
   - **Account #0 (Inspector/Admin)**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - **Account #1 (Seller)**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - **Account #2 (Buyer)**: `0x5de4111afa1a4b939086698bda5564f1403ee6b4f337ddda4413d9046ce2bb9e`
