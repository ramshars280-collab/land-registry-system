# School of Engineering and Technology, MGM University
### Chh. Sambhajinagar — Academic Year 2025-2026
---

# Mini Project Report
## On
# “Blockchain-Based Land Registry System (TerraChain)”

**Submitted in partial fulfillment for Sixth semester of B.Tech (Regular) in**  
### COMPUTER SCIENCE AND ENGINEERING  
**(IoT, Cyber Security Including Block Chain Technology)**

---

### Submitted By:
- **Ramsha Siddiqui** — PRN: `202256108035`
- **Durga Rajput** — PRN: `202456108707`

### Under the Guidance of:
- **Ms. Bhagat C. B.** (Asst. Professor, CSE Department)

### Department Head:
- **Dr. Madhuri Kawarkhe** (HOD, CSE Department)

---

## DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
### CERTIFICATE

This is to certify that **Ramsha Siddiqui** (PRN: `202256108035`) and **Durga Rajput** (PRN: `202456108707`) have successfully completed their Mini-Project entitled **“Blockchain-Based Land Registry System”** in the course of **“Blockchain”** in the Sixth Semester during tenure of completing the **B.Tech** program in **Computer Science and Engineering (IoT, Cyber Security Including Blockchain Technology)** from **School of Engineering and Technology, MGM University**, Chh. Sambhajinagar.

| **Ms. Bhagat C. B.** | **Dr. Madhuri Kawarkhe** |
| :--- | :--- |
| Guide, CSE Department | HOD, CSE Department |

---

## TABLE OF CONTENTS

| Sr. No | Title |
| :---: | :--- |
| **1** | [Abstract](#1-abstract) |
| **2** | [Introduction](#2-introduction) |
| **3** | [Course Outcomes Integrated](#3-course-outcomes-integrated) |
| **4** | [Action Plan](#4-action-plan) |
| **5** | [Literature Review](#5-literature-review) |
| **6** | [Proposed Methodology](#6-proposed-methodology) |
| **7** | [Implementation](#7-implementation) |
| **8** | [Outputs of the Mini-Project](#8-outputs-of-the-mini-project) |
| **9** | [Skills Developed / Learning Out of this Mini-Project](#9-skills-developed--learning-out-of-this-mini-project) |
| **10** | [Applications of this Mini-Project](#10-applications-of-this-mini-project) |
| **11** | [Areas of Future Improvement](#11-areas-of-future-improvement) |
| **12** | [Conclusion](#12-conclusion) |

---

## 1. Abstract

Land registration is a foundational pillar of modern economic administration, establishing authoritative legal title over real property assets. However, conventional land records rely heavily on centralized departmental databases and physical paper registries, which remain inherently vulnerable to record tampering, fraudulent duplicate deed issuance, unauthorized modifications by compromised administrators, and bureaucratic opacity. In developing economies, land disputes account for a staggering share of all civil litigation due to unreliable chain-of-title archives.

To resolve these critical vulnerabilities, this project develops **TerraChain**, an end-to-end decentralized, production-grade **Blockchain-Based Land Registry and Title Transfer System** deployed on EVM-compatible blockchain infrastructure. Rather than relying on rudimentary client-side simulations, the latest system is architected using **Solidity (v0.8.20)** smart contracts, the **Hardhat** development environment, **Pinata IPFS (InterPlanetary File System)** decentralized storage, **Ethers.js (v6)**, and a modern **React 18 (Vite + Tailwind CSS)** Web3 client.

All parcel registrations, surveyor blueprints, and deed PDFs are cryptographically anchored to IPFS, storing the immutable 32-byte Content Identifier (CID) directly within the smart contract. A two-tier gatekeeper workflow requires designated **Government Land Inspectors** to physically audit deeds and verify titles on-chain before a property can enter the marketplace. Once verified, owners can list parcels, and prospective buyers execute trustless, atomic purchases governed by smart contract escrow with OpenZeppelin `ReentrancyGuard`, ensuring simultaneous ETH payment settlement, title reassignment, and automatic surplus payment refunds. The smart contract integrity is validated through an automated test suite of 21 comprehensive test cases with 100% assertions satisfied.

---

## 2. Introduction

Traditional land administration frameworks suffer from severe systemic inefficiencies. In centralized relational database architectures (e.g., standard SQL systems), any compromised administrative credential, rogue employee, or system vulnerability allows direct `UPDATE` or `DELETE` operations on property ownership records without producing an immutable cryptographic audit trail. Furthermore, prospective property buyers face immense friction, high legal search fees, and weeks of delay when attempting to verify historical chains of title across fragmented municipal archives.

Blockchain technology eliminates the single point of failure by introducing a distributed, cryptographically secured, append-only state machine. In Ethereum and EVM-compatible networks, state transitions are governed by self-executing smart contracts whose byte code is immutably deployed to the ledger. Once written, a property title cannot be altered, forged, or backdated by any external entity or single official.

However, deploying real estate systems on public blockchains presents a technical bottleneck: storing multi-megabyte deed PDFs, satellite GIS surveys, and cadastral boundary maps directly on-chain is cost-prohibitive due to gas fees. TerraChain resolves this challenge through a **hybrid on-chain/off-chain decentralized architecture**:
1. High-resolution deed documents and survey plans are stored in decentralized, peer-to-peer storage via **Pinata IPFS**.
2. The resulting cryptographic content hash (CID), parcel parameters, ownership states, and escrow logic are executed on-chain via **Solidity smart contracts**.

This design delivers mathematical proof of title provenance, eliminates predatory middlemen, enforces role-based government verification, and provides instantaneous settlement for property transactions.

---

## 3. Course Outcomes Integrated

The design, implementation, and evaluation of TerraChain directly integrate the core course outcomes of the B.Tech Computer Science and Engineering (IoT, Cyber Security Including Blockchain Technology) curriculum:

- **CO-1: Cryptographic Hashing & Data Integrity Verification**  
  Understand and apply cryptographic hashing algorithms (Keccak-256 and SHA-256) alongside decentralized content-addressing (IPFS CID) to ensure tamper-evident storage of legal documents and instantaneous detection of data corruption.
- **CO-2: Distributed Ledger Concepts & Consensus Mechanisms**  
  Analyze distributed ledger state machines, EVM gas economics, smart contract execution models, and consensus protocols (Proof-of-Stake / Proof-of-Authority) underpinning decentralized public networks.
- **CO-3: Web3 Interface & Decentralized Application Development**  
  Design and build production-grade, responsive Web3 user interfaces utilizing React 18, Tailwind CSS, Vite, and Ethers.js (v6) with MetaMask provider/signer integration (EIP-1193).
- **CO-4: Secure Transactional Smart Contracts & Escrow Modeling**  
  Model secure transactional data structures in Solidity (v0.8.20), implementing role-based access control (`onlyAdmin`, `onlyOwner`), atomic escrow settlement, and chronological title provenance tracking.
- **CO-5: Smart Contract Cybersecurity, Threat Modeling & Auditing**  
  Evaluate vulnerabilities in decentralized systems—including reentrancy attacks, integer overflows, privilege escalation, and gas exhaustion—and enforce cryptographic resilience using OpenZeppelin `ReentrancyGuard`, custom errors, and automated unit test suites (21/21 passing tests).

---

## 4. Action Plan

| S. No. | Details of Activity | Planned Start Date | Planned Finish Date | Responsible Team Members |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Problem Formulation, Literature Survey, and EVM/IPFS System Architecture Design | Week 1 | Week 2 | Ramsha Siddiqui & Durga Rajput |
| **2** | Smart Contract Engineering: Solidity 0.8.20 `LandRegistry.sol`, OpenZeppelin ReentrancyGuard, Custom Errors & Atomic Escrow | Week 2 | Week 3 | Ramsha Siddiqui |
| **3** | Automated Testing & Security Verification: Hardhat & Chai Test Suite (21 Unit Tests with Balance & Event Assertions) | Week 3 | Week 4 | Durga Rajput |
| **4** | Decentralized Document Storage: Pinata IPFS Service Integration (`pinataService.js`), Drag-and-Drop Uploader & CID Resolution | Week 4 | Week 5 | Ramsha Siddiqui |
| **5** | Web3 Frontend Development: React 18, Vite, Tailwind CSS, Ethers.js v6, MetaMask Integration, and Role-Based Portals | Week 5 | Week 6 | Durga Rajput |
| **6** | End-to-End System Testing, Localhost Node Deployment, Cross-Role Flow Validation, and Academic Documentation | Week 6 | Week 7 | Ramsha Siddiqui & Durga Rajput |

---

## 5. Literature Review

Property registration systems globally have traversed three distinct historical eras:
1. **Manual Deed-Based Registries (Pre-Digital Era)**: Relied on physical parchment records, copper plates, or paper books bound in municipal record rooms. These registries were plagued by natural decay, fire hazards, loss during conflicts, and widespread fraudulent deed falsification.
2. **Computerized Centralized Databases (Late 20th – Early 21st Century)**: Governments digitized land records using centralized SQL databases (e.g., Bhoomi in Karnataka, Dharani in Telangana). While searchability improved, centralized architectures preserve a critical single point of failure: database administrators or corrupt officials with root privileges can execute clandestine `UPDATE` queries to reassign ownership without cryptographic detection.
3. **Decentralized Blockchain Ledgers (Modern Era)**: Formulated on distributed consensus and immutable cryptographic chaining. Each state change requires signed transactions validated by a distributed network.

Internationally, national land authorities have pioneered blockchain pilots:
- **Republic of Georgia**: Partnered with Bitfury and NAPR (National Agency of Public Registry) in 2016 to anchor land titles to the Bitcoin blockchain, recording over 1.5 million title transfers with zero contested fraud cases.
- **Sweden (Lantmäteriet)**: Tested private smart contracts with Telia and Chromaway to shorten real estate closing time from 4 months down to several hours.
- **India (Andhra Pradesh & Telangana)**: Initiated pilot projects in Amaravati and Hyderabad exploring distributed ledgers to safeguard agricultural allotments and prevent duplicate registry scams.

### The Storage Paradox in Blockchain Systems
A fundamental finding from existing literature is the **blockchain storage paradox**: storing 1 MB of arbitrary binary data (such as a 300 DPI scanned sale deed or surveyor map) directly in Ethereum EVM storage costs thousands of dollars in gas. TerraChain overcomes this limitation by implementing a **hybrid architecture** that uses **Pinata IPFS** for off-chain content-addressed storage while anchoring 32-byte cryptographic hashes (CIDs) on-chain in Solidity, ensuring maximum data integrity at minimal gas expense.

---

## 6. Proposed Methodology

TerraChain implements a modular 3-tier decentralized architecture:

```
+-------------------------------------------------------------------------------+
|                       TIER 3: CLIENT & WEB3 PRESENTATION                      |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + Ethers.js v6 Context        |
|  - Role-Based Dynamic Views (Admin / Land Inspector, Owner/Seller, Buyer)     |
|  - Drag-and-Drop Pinata IPFS Uploader with Progress Bar & Deed Gateway Link   |
|  - Floating Toast Notifications for Real-Time Transaction Feedback           |
+---------------------------------------+---------------------------------------+
                                        | (MetaMask EIP-1193 / JSON-RPC)
                                        v
+-------------------------------------------------------------------------------+
|                      TIER 1: SMART CONTRACT EXECUTION LAYER                   |
|  Solidity 0.8.20 (`LandRegistry.sol`) on Hardhat Node / EVM                  |
|  - Data Structures: Struct `Land` (id, address, area, price, ipfsHash, owner)  |
|  - Access Modifiers: `onlyAdmin` (Inspector), `onlyOwner` (Landowner)         |
|  - Atomic Escrow: `buyLand()` with OpenZeppelin `ReentrancyGuard`              |
|  - Gas-Optimized Custom Errors & State Change Event Emissions                 |
+---------------------------------------+---------------------------------------+
                                        |
                                        v (HTTPS REST API / Content CID)
+-------------------------------------------------------------------------------+
|                     TIER 2: DECENTRALIZED STORAGE LAYER                       |
|  Pinata IPFS (InterPlanetary File System)                                     |
|  - Cryptographic Content-Addressing: 32-Byte Hash (e.g., QmXoypizjW3WknFi...)  |
|  - Off-Chain Cadastral Blueprints, Scanned Sale Deeds, and Surveyor Maps     |
+-------------------------------------------------------------------------------+
```

### Computational Tiers Breakdown:
1. **Tier 1: Smart Contract Execution Layer (`LandRegistry.sol`)**:
   - Implemented in Solidity 0.8.20 and compiled via Hardhat.
   - Maintains the canonical state of all land parcels on the EVM.
   - Custom data struct `Land` tracks: `id`, `physicalAddress`, `areaSqFt`, `priceInWei`, `ipfsHash`, `currentOwner`, `isVerified`, and `isForSale`.
   - Incorporates OpenZeppelin's `ReentrancyGuard` and follows the **Checks-Effects-Interactions** security pattern.
2. **Tier 2: Decentralized Storage Layer (Pinata IPFS)**:
   - Eliminates bloated on-chain gas costs by offloading document storage to the InterPlanetary File System.
   - Files are pinned using Pinata's REST API, generating an immutable, cryptographic Content Identifier (CID).
   - If any actor alters a single byte or pixel of the off-chain deed, the resulting hash completely changes, instantly exposing fraud.
3. **Tier 3: Web3 Presentation & Integration Layer**:
   - Built with React 18, Vite, and Tailwind CSS.
   - Employs **Ethers.js v6** to manage provider/signer connections with MetaMask (`window.ethereum`).
   - Dynamically identifies the connected wallet address and renders tailored views for Government Inspectors, Landowners, and Buyers.

---

## 7. Implementation

The latest implementation is organized as a production-grade monorepo cleanly decoupling the smart contract development workspace from the Web3 client:

```
C:\LandBlock\
├── package.json                          # Monorepo automation commands
├── PROJECT_REPORT.md                     # Comprehensive academic project documentation
├── README.md                             # Quick-start documentation
│
├── blockchain\                           # Hardhat Smart Contract Workspace
│   ├── contracts\
│   │   └── LandRegistry.sol              # Solidity 0.8.20 smart contract
│   ├── scripts\
│   │   └── deploy.js                     # Deployment & frontend ABI synchronization script
│   ├── test\
│   │   └── LandRegistry.test.js          # Comprehensive 21 unit tests suite (Chai/Ethers)
│   ├── hardhat.config.js                 # Network settings (Localhost 31337 & Sepolia 11155111)
│   └── package.json                      # Hardhat, OpenZeppelin & Ethers dependencies
│
└── frontend\                             # Web3 Client Workspace (React 18 + Vite)
    ├── src\
    │   ├── components\
    │   │   └── DocumentUploader.jsx      # Drag-and-drop Pinata IPFS uploader with progress
    │   ├── context\
    │   │   └── Web3Context.jsx           # Global Web3 state manager & contract wrappers
    │   ├── contracts\
    │   │   ├── LandRegistryConfig.json   # Auto-synced contract address, chain ID & ABI
    │   │   └── LandRegistryABI.json      # Standalone contract ABI
    │   ├── services\
    │   │   └── pinataService.js          # Pinata IPFS file and metadata pinning service
    │   ├── utils\
    │   │   ├── ethereum.js               # MetaMask connection & formatting helpers
    │   │   └── ipfs.js                   # IPFS gateway resolver utilities
    │   ├── App.jsx                       # Main application shell with 4 role-based tabs
    │   ├── main.jsx                      # React application bootstrap
    │   └── index.css                     # Tailwind CSS directives
    ├── vite.config.js                    # Vite configuration
    └── package.json                      # React, Vite, Tailwind CSS, Lucide dependencies
```

### Key Smart Contract Functions (`LandRegistry.sol`):
- `registerLand(physicalAddress, areaSqFt, priceInWei, ipfsHash)`: Allows any landowner to register a parcel with an unverified (`isVerified = false`) and unlisted (`isForSale = false`) state.
- `verifyLand(landId)`: Restricted by the `onlyAdmin` modifier. The Government Land Inspector audits cadastral boundary maps on IPFS and certifies the title.
- `listForSale(landId, newPrice)`: Restricted by `onlyOwner`. Land must be verified before listing on the public marketplace.
- `delistLand(landId)`: Allows the current owner to remove an active listing from the marketplace.
- `buyLand(landId)`: Payable function with `nonReentrant` modifier. Validates payment, reassigns ownership, resets listing state, transfers funds to the seller, and refunds any excess payment atomically.
- `getLandDetails(landId)` & `getLandsByOwner(ownerAddress)`: Public view functions enabling real-time dashboard data queries.

### Gas-Optimized Custom Errors:
Rather than storing verbose string revert messages in contract bytecode, 11 custom errors reduce contract deployment and execution gas:
`NotAdmin()`, `NotOwner()`, `LandNotFound()`, `LandAlreadyVerified()`, `LandNotVerified()`, `LandNotForSale()`, `InsufficientPayment()`, `CannotBuyOwnLand()`, `InvalidArea()`, `InvalidPrice()`, `EmptyAddress()`, `EmptyIpfsHash()`, `EtherTransferFailed()`.

---

## 8. Outputs of the Mini-Project

The completed system executes all real-world land administration workflows with instantaneous visual feedback and on-chain verification:

1. **MetaMask Wallet Connection & Multi-Persona Detection**:
   - The user connects their MetaMask wallet to the local Hardhat network (`http://127.0.0.1:8545`, Chain ID: `31337`).
   - The application automatically switches UI modes based on the active wallet address:
     - **Admin / Inspector**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
     - **Seller / Current Owner**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
     - **Buyer**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
2. **Land Parcel Registration with IPFS Pinning**:
   - In the **Register Property** tab, the user enters property details (e.g., Street Address, Area in Sq Ft, Price in ETH) and drops a deed PDF into the uploader.
   - The document is pinned to Pinata IPFS, returning a cryptographic CID (`Qm...`).
   - The user signs the `registerLand()` transaction via MetaMask, emitting the `LandRegistered` event.
3. **Government Inspector Title Audit & Verification**:
   - Switching to the Admin account reveals the **Inspector Panel**.
   - The Inspector opens the attached deed on the IPFS gateway, confirms authenticity, and clicks **"Verify Title"**.
   - The transaction confirms on-chain, and the parcel badge updates to a green **"Verified"** state.
4. **Marketplace Listing & Asking Price Configuration**:
   - In the **My Assets** tab, the property owner sets an asking price (e.g., 2.5 ETH) and clicks **"List for Sale"**.
   - The property immediately populates the public **Marketplace** tab with price and parcel specifications.
5. **Atomic Escrow Purchase & Instant Title Transfer**:
   - The Buyer selects **"Buy Now"** from the Marketplace tab and confirms the transaction in MetaMask with 2.5 ETH.
   - The smart contract atomically transfers 2.5 ETH to the seller's wallet, reassigns `currentOwner` to the buyer, removes the listing from the marketplace, and refunds any excess payment immediately.
6. **Automated Verification Matrix**:
   - All 21 Hardhat unit test cases pass in under 1 second, confirming zero regressions across deployment, access control, edge-case rejection, and reentrancy protection.

---

## 9. Skills Developed / Learning Out of this Mini-Project

Through the conceptualization, engineering, and testing of TerraChain, the following advanced competencies were acquired:
- **Solidity Smart Contract Development**: Mastered Solidity 0.8.20 programming, state variables, structs, mappings, view/payable functions, custom errors, and events.
- **EVM Security Patterns**: Implemented OpenZeppelin's `ReentrancyGuard`, enforced the Checks-Effects-Interactions pattern, and mitigated smart contract vulnerabilities.
- **Hardhat Toolchain Mastery**: Built automated test suites using Mocha and Chai, automated contract deployments with scripted ABI synchronization, and simulated multi-account local nodes.
- **Decentralized Storage Protocols**: Integrated IPFS and Pinata REST APIs for off-chain content-addressed file storage and dynamic CID resolution.
- **Full-Stack Web3 Engineering**: Developed reactive frontends using React 18, Vite, and Tailwind CSS, leveraging Ethers.js v6 for wallet communication, BigInt arithmetic, and EIP-1193 event listeners.
- **Rigorous Software Testing & Documentation**: Executed 21 unit tests covering edge cases and balance assertions, producing comprehensive academic documentation and architecture diagrams.

---

## 10. Applications of this Mini-Project

The decentralized architecture demonstrated by TerraChain has extensive real-world applications across civic, commercial, and financial domains:

1. **Municipal & State Land Revenue Registries**: Government land registries can replace vulnerable relational SQL databases with an immutable smart contract ledger, completely eradicating forged deeds, illegal double-selling of plots, and collusive backdated changes.
2. **Transparent Agricultural Land Records & Succession**: Rural property borders and multi-owner family inheritances frequently suffer from protracted litigation. An immutable public ledger establishes a clear, undeniable line of historical title succession.
3. **Commercial Bank Mortgage & Collateral Due Diligence**: Banking institutions can instantly inspect property records, verified deeds, and title histories on-chain, eliminating weeks of manual legal searches and preventing fraudulent multi-bank pledging.
4. **Commercial Real Estate Marketplace & Escrow**: Eliminates expensive third-party escrow services by leveraging autonomous smart contracts that settle high-value property transfers instantaneously with zero counterparty risk.
5. **Cadastral Boundary & Surveyor Blueprint Tracking**: Satellite GIS survey files and municipal master plans can be permanently pinned to IPFS, ensuring public transparency over civic zoning and land-use designations.
6. **Academic & Research Smart Contract Benchmarking**: Serves as a reference implementation for engineering students to evaluate EVM gas consumption, IPFS content addressing, and role-based access control.

---

## 11. Areas of Future Improvement

While the current implementation delivers a fully functional, production-ready decentralized land registry, several advanced extensions can be incorporated for nationwide enterprise deployment:

1. **Multi-Signature (Multi-Sig) Consensus for Government Registrars**: Implement a multi-sig approval threshold requiring the simultaneous cryptographic signatures of the Sub-Registrar, Municipal Town Planner, and Revenue Officer before title verification is finalized.
2. **National Digital Identity (DID) & Aadhaar e-KYC Integration**: Link Ethereum wallet addresses to sovereign identity credentials (e.g., Aadhaar e-KYC and digital signatures) to cryptographically verify buyer and seller identities while satisfying legal regulatory requirements.
3. **Zero-Knowledge Proofs (zk-SNARKs) for Financial Privacy**: Integrate zk-SNARKs to allow property buyers and sellers to verify transaction solvency and legal compliance without broadcasting private sale valuations to public blockchain explorers.
4. **Layer-2 Rollups (Arbitrum / Polygon) Deployment**: Migrate contract deployment from Ethereum mainnet to Layer-2 optimistic or zero-knowledge rollups to achieve sub-cent transaction gas fees and thousands of transactions per second.
5. **Decentralized Legal Dispute Arbitration (Kleros Protocol)**: Integrate decentralized crowd-jury arbitration protocols such as Kleros to resolve boundary disputes and inheritance contestations through economic staking incentives.

---

## 12. Conclusion

Land registration is a cornerstone of modern governance and economic stability, yet conventional paper and centralized database registers continue to be compromised by bureaucratic opacity, tampering, single points of failure, and rampant litigation.

This mini-project successfully engineered, deployed, and verified **TerraChain (Blockchain-Based Land Registry System)**, a state-of-the-art decentralized dApp that addresses the systemic vulnerabilities of land governance. By uniting **Solidity 0.8.20 smart contracts**, **Pinata IPFS decentralized deed storage**, and a reactive **React 18 + Ethers.js v6 Web3 client**, the system establishes a permanent, auditable, and mathematically unalterable record of property ownership.

The smart contract enforces a two-tier gatekeeper architecture where Government Land Inspectors authenticate cadastral documents before marketplace trading is enabled. Property purchases settle atomically with full reentrancy protection and automatic surplus refunds. Validated against 21 automated unit tests with 100% pass rates, TerraChain demonstrates how blockchain technology can eradicate property deed fraud, streamline municipal administration, and restore citizen trust in digital property governance.
