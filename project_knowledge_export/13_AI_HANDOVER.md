# 13. AI Assistant Handover & Continuation Guide

## 1. Quick Orientation for AI Assistants

If you are an AI assistant tasked with maintaining, extending, or debugging this repository, read this section first:

- **Workspace Path**: `c:\LandBlock`
- **What this project is**: A decentralized Ethereum land registry dApp ("TerraChain / LandBlock").
- **Core Stack**: React 18, Vite, Tailwind CSS, Ethers.js v6, Hardhat, Solidity 0.8.20, Pinata IPFS.
- **Is there a backend?**: **NO.** There is no Express/Django/FastAPI server. The frontend speaks directly to the Ethereum node via JSON-RPC (`http://127.0.0.1:8545`) and Pinata via HTTPS.
- **Is there a database?**: **NO.** All state is stored in `LandRegistry.sol` on-chain. All documents are pinned to IPFS.

---

## 2. Running State & Live Ports

- **Hardhat Blockchain Node**:
  - URL: `http://127.0.0.1:8545`
  - Chain ID: `31337`
  - Deployed Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Frontend Dev Server**:
  - URL: `http://localhost:3000`
  - Bundler: Vite 5

---

## 3. Account Identities & Demo Credentials

| Role | Email Login | Password | Hardhat Account Index | Address |
| :--- | :--- | :--- | :--- | :--- |
| **Inspector (Admin)** | `inspector@terrachain.gov.in` | `inspector123` | Account #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| **Seller (Owner)** | `seller@terrachain.io` | `seller123` | Account #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Buyer** | `buyer@terrachain.io` | `buyer123` | Account #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |

---

## 4. Source Code Navigation Map

```
c:\LandBlock\
├── blockchain/
│   ├── contracts/
│   │   └── LandRegistry.sol          <-- MAIN SMART CONTRACT (All business logic)
│   ├── test/
│   │   └── LandRegistry.test.js      <-- MOCHA/CHAI TESTS (16 passing specs)
│   └── scripts/
│       └── deploy.js                 <-- DEPLOYMENT SCRIPT (Writes config & ABI to frontend)
└── frontend/
    └── src/
        ├── App.jsx                   <-- CORE APPLICATION (All state, modals, views)
        ├── components/
        │   ├── LoginPage.jsx         <-- MULTI-PORTAL LOGIN GATEWAY
        │   └── DocumentUploader.jsx  <-- PINATA IPFS DEED UPLOADER
        ├── context/
        │   └── Web3Context.jsx       <-- ETHERS.JS PROVIDER & WALLET MANAGER
        ├── contracts/
        │   ├── LandRegistryABI.json  <-- COMPILED CONTRACT ABI
        │   └── LandRegistryConfig.json <-- CURRENT CONTRACT ADDRESS
        └── services/
            └── pinataService.js      <-- PINATA REST API CLIENT
```

---

## 5. Critical Code Gotchas & Rules for Future AI Instances

1. **Do Not Introduce a Centralized DB Without Prompting**:
   - The user's system intentionally operates as a serverless dApp. Do not attempt to add MongoDB or PostgreSQL unless explicitly requested.
2. **Beware the Contract Address Cache**:
   - Whenever `npx hardhat run scripts/deploy.js --network localhost` is executed, the contract gets redeployed. `scripts/deploy.js` automatically overwrites `frontend/src/contracts/LandRegistryConfig.json` and `LandRegistryABI.json`. Ensure the frontend is refreshed after any redeployment.
3. **The `_ownerLands` Quirk**:
   - In `LandRegistry.sol`, purchasing a land does not delete the land ID from the seller's `_ownerLands` array. When writing frontend filters, always check `land.currentOwner.toLowerCase() === user.toLowerCase()` rather than blindly trusting `contract.getLandsByOwner(user)`.
4. **Theme Classes**:
   - The UI supports both dark and light mode. Always write Tailwind utility classes with both variants (e.g. `bg-white dark:bg-slate-900 text-slate-900 dark:text-white`).

---

## 6. Recommended Next Development Task

The single most impactful engineering improvement is **modularizing `frontend/src/App.jsx`**. 
Extract the views into dedicated files:
- `frontend/src/views/MarketplaceView.jsx`
- `frontend/src/views/InspectorDashboard.jsx`
- `frontend/src/views/MyLandsView.jsx`
- `frontend/src/views/AuditTrailView.jsx`
