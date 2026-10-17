# TerraChain (LandBlock) Technical Documentation & Knowledge Export

## Executive Summary
This directory (`project_knowledge_export/`) contains a complete, verified architectural and technical audit of **TerraChain (LandBlock)** — a decentralized land registration and title transfer platform developed by MGM University B.Tech Computer Science & Engineering students (Department of CSE, Jawaharlal Nehru Engineering College, Chhatrapati Sambhaji Nagar).

This audit was conducted by inspecting every active source file across the monorepo, smart contracts, frontend components, configuration files, and automated tests.

---

## Documentation Index

| File | Document Name | Purpose & Scope |
| :--- | :--- | :--- |
| **[01_PROJECT_OVERVIEW.md](file:///c:/LandBlock/project_knowledge_export/01_PROJECT_OVERVIEW.md)** | Project Overview & Domain Context | Explains the mission, real-world land title challenges solved, stakeholder roles, user journeys, and development status. |
| **[02_ARCHITECTURE_AND_DATA_FLOW.md](file:///c:/LandBlock/project_knowledge_export/02_ARCHITECTURE_AND_DATA_FLOW.md)** | System Architecture & Data Flow | End-to-end architecture, decentralized topology, Mermaid diagrams, trust boundaries, and single points of failure. |
| **[03_FRONTEND_ANALYSIS.md](file:///c:/LandBlock/project_knowledge_export/03_FRONTEND_ANALYSIS.md)** | Frontend Component & UI Audit | Deep inspection of React 18, Tailwind CSS, multi-portal authentication gateway, state management, and IPFS upload logic. |
| **[04_BACKEND_AND_API_REFERENCE.md](file:///c:/LandBlock/project_knowledge_export/04_BACKEND_AND_API_REFERENCE.md)** | Backend & Network Communication | Documentation of the direct EVM RPC architecture, Pinata IPFS API v3 endpoints, and contract JSON-RPC queries. |
| **[05_DATABASE_SCHEMA.md](file:///c:/LandBlock/project_knowledge_export/05_DATABASE_SCHEMA.md)** | Data Models & On-Chain State | Analysis of the state storage model, EVM storage layout, IPFS CID hashing, ER schema, and absence of SQL/NoSQL DBs. |
| **[06_BLOCKCHAIN_AND_SMART_CONTRACTS.md](file:///c:/LandBlock/project_knowledge_export/06_BLOCKCHAIN_AND_SMART_CONTRACTS.md)** | Smart Contract Deep Dive | Comprehensive audit of `LandRegistry.sol` (Solidity 0.8.20), modifiers, custom errors, events, and gas profiling. |
| **[07_SECURITY_AUDIT.md](file:///c:/LandBlock/project_knowledge_export/07_SECURITY_AUDIT.md)** | Security & Vulnerability Audit | Threat modeling, reentrancy defense, access controls, front-running risks, and the `_ownerLands` array retention issue. |
| **[08_WORKFLOWS_AND_SEQUENCE_DIAGRAMS.md](file:///c:/LandBlock/project_knowledge_export/08_WORKFLOWS_AND_SEQUENCE_DIAGRAMS.md)** | End-to-End Workflow Diagrams | Step-by-step transaction walkthroughs with Mermaid sequence diagrams (Registration, Verification, Listing, Purchase). |
| **[09_SETUP_AND_CONFIGURATION.md](file:///c:/LandBlock/project_knowledge_export/09_SETUP_AND_CONFIGURATION.md)** | Environment & Deployment Manual | Setup prerequisites, environment variables, Hardhat deployment commands, Vite dev server, and MetaMask wallet import. |
| **[10_TESTING_AND_QA.md](file:///c:/LandBlock/project_knowledge_export/10_TESTING_AND_QA.md)** | Testing & Quality Assurance | Hardhat Mocha/Chai test suite coverage, edge case analysis, test results verification, and missing automated tests. |
| **[11_BUGS_AND_TECHNICAL_DEBT.md](file:///c:/LandBlock/project_knowledge_export/11_BUGS_AND_TECHNICAL_DEBT.md)** | Bugs, Flaws & Technical Debt | Prioritized defects (Critical, High, Medium, Low) including the unremoved land ownership array defect and fallback mocks. |
| **[12_IMPLEMENTATION_STATUS_AND_ROADMAP.md](file:///c:/LandBlock/project_knowledge_export/12_IMPLEMENTATION_STATUS_AND_ROADMAP.md)** | Implementation Matrix & Roadmap | Verified vs Mocked vs Planned feature matrix with an engineering roadmap for production readiness. |
| **[13_AI_HANDOVER.md](file:///c:/LandBlock/project_knowledge_export/13_AI_HANDOVER.md)** | AI Assistant Handover Guide | Rapid orientation briefing for subsequent AI coding assistants to maintain and extend the codebase without re-auditing. |
| **[14_FILE_INVENTORY.md](file:///c:/LandBlock/project_knowledge_export/14_FILE_INVENTORY.md)** | Comprehensive File Inventory | Exact catalog of all active repository files, line counts, responsibilities, and key exports. |

---

## Key Findings Snapshot
1. **Architectural Pattern**: TerraChain is a serverless, purely decentralized Web3 dApp. There is **no traditional backend server** (e.g. Express/FastAPI) and **no traditional database** (PostgreSQL/MongoDB). All state is stored inside the EVM smart contract `LandRegistry.sol`, and physical deed files are pinned to IPFS via Pinata.
2. **Access Control & RBAC**: The contract designates the deployer as `admin` (Government Land Inspector). Only this admin can verify lands. Regular users can register parcels, list verified parcels, and purchase listed parcels with native ETH.
3. **Frontend Multi-Portal**: Built with React 18, Vite, and Tailwind CSS. Features role-specific portals (Inspector, Seller, Buyer) with preconfigured Hardhat demo credentials, complete light/dark mode support, and interactive deed verification dialogs.
4. **Primary Contract Defect**: In `LandRegistry.sol:buyLand()` (L257), `_ownerLands[msg.sender].push(landId)` registers the new owner's parcel, but the land ID is **not removed** from `_ownerLands[previousOwner]`. Stale listings remain in historical owner arrays unless filtered client-side.
