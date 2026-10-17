# TerraChain — Decentralized Land Registry & Title Transfer System

A production-grade decentralized land registry and real estate marketplace built with **Solidity (v0.8.20)**, **Hardhat**, **Ethers.js (v6)**, **Pinata IPFS**, and **React 18 (Vite + Tailwind CSS)**.

> Complete technical architecture and MGM University Sixth Semester Mini Project Report available in [PROJECT_REPORT.md](file:///c:/LandBlock/PROJECT_REPORT.md), [Blockchain_Land_Registry_Mini_Project_Report.pdf](file:///c:/LandBlock/Blockchain_Land_Registry_Mini_Project_Report.pdf), and [Blockchain_Land_Registry_Mini_Project_Report.docx](file:///c:/LandBlock/Blockchain_Land_Registry_Mini_Project_Report.docx).

---

## Quick Start (Localhost Demonstration)

### 1. Start Local Hardhat Blockchain Node
```powershell
cd C:\LandBlock\blockchain
npx hardhat node
```
*Runs on `http://127.0.0.1:8545` (Chain ID: `31337`) with 20 test accounts (10,000 ETH each).*

### 2. Deploy Smart Contract & Sync ABI
```powershell
cd C:\LandBlock\blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*Deploys `LandRegistry.sol` and auto-exports ABI and contract address to `frontend/src/contracts/`.*

### 3. Start Web3 Frontend
```powershell
cd C:\LandBlock\frontend
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## Test Accounts (Import into MetaMask)

- **Admin / Inspector**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
  Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Seller / Owner**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`  
  Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Buyer**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`  
  Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

---

## Key Features
- **Role-Based Navigation**: Dynamic UI adjustments for Admin, Owner, and Buyer.
- **Pinata IPFS Integration**: Decentralized deed document uploading with drag-and-drop and progress tracking.
- **Smart Contract Escrow**: Atomic purchase handling with ReentrancyGuard and excess ETH refunds.
- **Real-Time Toast Alerts**: Floating transaction status banners (Pending, Success, Failed).
