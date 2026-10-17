# 14. Comprehensive File Inventory & Catalog

## 1. Monorepo Root Directory

| File Path | Lines | Purpose | Key Exports / Elements |
| :--- | :--- | :--- | :--- |
| `package.json` | 28 | Root npm workspace coordinator scripts. | Scripts: `dev`, `deploy:local`, `test`, `build`. |
| `README.md` | 148 | Academic project README with setup instructions and project abstract. | Documentation, architecture diagrams, run commands. |
| `PROJECT_REPORT.md`| 285 | Formal MGM University B.Tech CSE project submission report. | Authors, department, abstract, methodology, results. |
| `.gitignore` | 24 | Git ignore rules for node_modules, build artifacts, and env files. | Ignores `.env`, `artifacts/`, `cache/`, `dist/`. |

---

## 2. Blockchain Package (`blockchain/`)

| File Path | Lines | Purpose | Key Exports / Elements |
| :--- | :--- | :--- | :--- |
| `blockchain/package.json` | 32 | Hardhat project dependencies and test runner scripts. | `@nomicfoundation/hardhat-toolbox`, `ethers`, `hardhat`. |
| `blockchain/hardhat.config.js` | 42 | Hardhat EVM compiler, networks, and settings. | Solidity `0.8.20`, optimizer runs `200`, networks: `hardhat`, `localhost`, `sepolia`. |
| `blockchain/.env.example` | 8 | Environment variable template for blockchain network deployment. | `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`. |
| `blockchain/contracts/LandRegistry.sol` | 304 | Main smart contract holding all registry state, access control, and payment logic. | `LandRegistry` contract, `struct Land`, `registerLand`, `verifyLand`, `listForSale`, `buyLand`. |
| `blockchain/test/LandRegistry.test.js` | 249 | Comprehensive automated test suite with Mocha/Chai. | 5 suites, 16 test specs, event assertions, custom error checks. |
| `blockchain/scripts/deploy.js` | 58 | Automated contract deployment script. | Deploys `LandRegistry`, writes address & ABI to frontend config directory. |

---

## 3. Frontend Package (`frontend/`)

| File Path | Lines | Purpose | Key Exports / Elements |
| :--- | :--- | :--- | :--- |
| `frontend/package.json` | 36 | Frontend dependencies and build scripts. | `react`, `react-dom`, `vite`, `tailwindcss`, `ethers`, `axios`, `lucide-react`. |
| `frontend/vite.config.js` | 18 | Vite bundler configuration. | React plugin, port `3000` dev server mapping. |
| `frontend/tailwind.config.js` | 26 | Tailwind CSS styling rules, themes, and content paths. | Dark mode toggle, color extensions, responsive typography. |
| `frontend/postcss.config.js` | 6 | PostCSS configuration for Tailwind autoprefixer. | `tailwindcss`, `autoprefixer`. |
| `frontend/index.html` | 22 | HTML5 document root and font link injection. | Imports Google Font `Inter`, sets root `#root` div. |
| `frontend/.env.example` | 8 | Frontend environment variable template. | `VITE_CONTRACT_ADDRESS`, `VITE_PINATA_API_KEY`, etc. |
| `frontend/src/main.jsx` | 14 | React entry point mounting App inside `Web3Provider`. | `createRoot`, `Web3Provider`, `<App />`. |
| `frontend/src/index.css` | 48 | Global stylesheet and Tailwind core directives. | `@tailwind base; components; utilities;`, glassmorphic utilities. |
| `frontend/src/App.jsx` | 985 | Central application hub managing state, views, modals, and contract interactions. | `App` component, navigation, marketplace, modals, theme switch. |
| `frontend/src/components/LoginPage.jsx` | 188 | Multi-portal authentication gateway with demo preset auto-fill. | `LoginPage` component, Inspector/Seller/Buyer tabs, credentials. |
| `frontend/src/components/DocumentUploader.jsx` | 124 | Drag-and-drop deed document uploader with Pinata IPFS binding. | `DocumentUploader`, file validation, IPFS hash generation. |
| `frontend/src/context/Web3Context.jsx` | 112 | React Context managing Ethers provider, contract, and accounts. | `Web3Context`, `Web3Provider`, `useWeb3` custom hook. |
| `frontend/src/contracts/LandRegistryConfig.json` | 6 | JSON file containing the deployed contract address and network chain ID. | `address: "0x5FbDB...8aa3"`, `chainId: 31337`. |
| `frontend/src/contracts/LandRegistryABI.json` | 320 | JSON file defining the contract's Application Binary Interface. | Array of function signatures, error definitions, and events. |
| `frontend/src/services/pinataService.js` | 74 | Axios-based service communicating with Pinata IPFS API. | `pinFileToIPFS`, `testPinataAuthentication`. |
| `frontend/src/utils/ethereum.js` | 65 | Web3 utility helpers for network switching and address formatting. | `formatAddress`, `formatEther`, `switchNetwork`. |
| `frontend/src/utils/ipfs.js` | 38 | IPFS CID utility functions and public gateway resolver. | `getIpfsGatewayUrl`, `formatIpfsHash`. |

---

## 4. Documentation & Artifacts (`project_knowledge_export/`)

| File Path | Description |
| :--- | :--- |
| `project_knowledge_export/README.md` | Executive index and directory documentation map. |
| `project_knowledge_export/01_PROJECT_OVERVIEW.md` | Problem statement, stakeholders, user roles, journeys, status. |
| `project_knowledge_export/02_ARCHITECTURE_AND_DATA_FLOW.md` | Architectural topology, communication protocols, trust boundaries. |
| `project_knowledge_export/03_FRONTEND_ANALYSIS.md` | Component breakdown, role routing, theme system, form validation. |
| `project_knowledge_export/04_BACKEND_AND_API_REFERENCE.md` | Pinata REST endpoints, JSON-RPC methods, error decoding table. |
| `project_knowledge_export/05_DATABASE_SCHEMA.md` | EVM storage slots, struct layout, IPFS CIDs, ER diagram. |
| `project_knowledge_export/06_BLOCKCHAIN_AND_SMART_CONTRACTS.md` | Smart contract audit, functions, modifiers, events, gas profile. |
| `project_knowledge_export/07_SECURITY_AUDIT.md` | Vulnerability audit, reentrancy checks, `_ownerLands` defect. |
| `project_knowledge_export/08_WORKFLOWS_AND_SEQUENCE_DIAGRAMS.md` | Registration, verification, listing, and purchase sequence diagrams. |
| `project_knowledge_export/09_SETUP_AND_CONFIGURATION.md` | Step-by-step installation, environment variables, MetaMask guide. |
| `project_knowledge_export/10_TESTING_AND_QA.md` | Test suite coverage, Mocha/Chai results, missing QA tests. |
| `project_knowledge_export/11_BUGS_AND_TECHNICAL_DEBT.md` | Prioritized bug inventory, technical debt, and code smells. |
| `project_knowledge_export/12_IMPLEMENTATION_STATUS_AND_ROADMAP.md` | Status matrix and phased engineering roadmap. |
| `project_knowledge_export/13_AI_HANDOVER.md` | Concise orientation guide for future AI coding agents. |
| `project_knowledge_export/14_FILE_INVENTORY.md` | Complete repository file catalog with line counts and exports. |
