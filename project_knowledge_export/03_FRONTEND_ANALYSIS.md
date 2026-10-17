# 03. Frontend Component & UI Audit

## 1. Frontend Architecture & Technology Stack

- **Framework**: React 18.3.1
- **Build Tooling**: Vite 5.4.11 (`@vitejs/plugin-react: 4.3.4`)
- **Styling Architecture**: Tailwind CSS 3.4.15 with custom color palette and responsive breakpoint utilities.
- **Iconography**: `lucide-react` (v0.460.0)
- **Web3 Interface**: `ethers` (v6.13.5)
- **HTTP Client**: `axios` (v1.7.9) for Pinata IPFS file transmission.

---

## 2. Directory Structure & Key Files

```
frontend/
├── index.html                   # HTML5 Entry Point with Google Fonts (Inter)
├── package.json                 # Dependency Manifest
├── vite.config.js               # Dev server configuration (Port 3000)
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS Autoprefixer plugin
└── src/
    ├── main.jsx                 # React root render (`Web3Provider` wrapping `App`)
    ├── App.jsx                  # Main application state, views, routing, and modals (985 lines)
    ├── index.css                # Global CSS styles and Tailwind directives
    ├── components/
    │   ├── LoginPage.jsx        # Multi-portal authentication gateway & role selector
    │   └── DocumentUploader.jsx # Drag-and-drop deed file uploader with Pinata IPFS integration
    ├── context/
    │   └── Web3Context.jsx      # Web3 state provider (signer, provider, accounts, contract)
    ├── contracts/
    │   ├── LandRegistryABI.json # Smart contract JSON ABI definition
    │   └── LandRegistryConfig.json # Deployed address (`0x5FbDB...8aa3`) and chain ID
    ├── services/
    │   └── pinataService.js     # IPFS pinning service via Pinata API
    └── utils/
        ├── ethereum.js          # Ethers provider helpers & network switcher
        └── ipfs.js              # IPFS CID URL formatter & gateway resolver
```

---

## 3. View Routing & State Management

The frontend uses **in-memory conditional view routing** managed via React state (`currentView` in `App.jsx:L32`), rather than `react-router-dom`. This prevents full-page reloads and maintains Web3 wallet connections continuously.

### Views Managed by `App.jsx`
1. `marketplace`: Public discovery catalog for browsing verified and listed properties.
2. `my-lands`: Filtered portfolio displaying parcels owned by the currently authenticated address.
3. `register`: Multi-step property onboarding form with survey coordinate inputs and deed document uploader.
4. `inspector`: Government verification dashboard for pending parcels.
5. `audit-trail`: Comprehensive historical ledger of all registered properties, ownership chains, and IPFS CIDs.

### Role-Based Access Restriction Matrix

| Portal Role | Allowed Views | Restricted Views (UI Level) |
| :--- | :--- | :--- |
| **Inspector** (`inspector@terrachain.gov.in`) | `inspector`, `audit-trail` | `register`, `marketplace`, `my-lands` |
| **Seller** (`seller@terrachain.io`) | `my-lands`, `register`, `marketplace`, `audit-trail` | `inspector` |
| **Buyer** (`buyer@terrachain.io`) | `marketplace`, `my-lands`, `audit-trail` | `register`, `inspector` |

---

## 4. Component Deep Dive

### A. Authentication Gateway: `LoginPage.jsx`
- **Location**: `frontend/src/components/LoginPage.jsx`
- **Responsibilities**:
  - Provides a 3-tab card switcher for **Land Inspector**, **Property Seller**, and **Property Buyer**.
  - Displays official agency badges (e.g., *Dept. of Land Records, Government of India* for Inspector).
  - Offers a **"Use Demo Credentials"** button that automatically fills in test accounts and maps them to the corresponding Hardhat testnet address.
  - Implements demo accounts:
    - Inspector: `inspector@terrachain.gov.in` / `inspector123` (Deployer Account `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
    - Seller: `seller@terrachain.io` / `seller123` (Account #1 `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)
    - Buyer: `buyer@terrachain.io` / `buyer123` (Account #2 `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`)

### B. Deed Document Uploader: `DocumentUploader.jsx`
- **Location**: `frontend/src/components/DocumentUploader.jsx`
- **Responsibilities**:
  - Provides a drag-and-drop file dropzone with visual progress tracking.
  - Validates file constraints: PDF, PNG, JPG format with maximum size limit of 10MB (`MAX_FILE_SIZE = 10 * 1024 * 1024`).
  - Calls `pinFileToIPFS(file)` in `pinataService.js`.
  - Displays the resulting 46-character IPFS CID hash and a direct hyperlink to the IPFS gateway viewer.

### C. Web3 Context Provider: `Web3Context.jsx`
- **Location**: `frontend/src/context/Web3Context.jsx`
- **Responsibilities**:
  - Initializes an `ethers.JsonRpcProvider` connecting to `http://127.0.0.1:8545`.
  - Binds the contract address from `LandRegistryConfig.json` with the ABI from `LandRegistryABI.json`.
  - Supports role-swapping: dynamically creates `ethers.Wallet` signer instances for the selected demo account or hooks into `window.ethereum` (MetaMask).

### D. Main Application Hub: `App.jsx`
- **Location**: `frontend/src/App.jsx`
- **Responsibilities**:
  - Contains all modal dialogs:
    - **Listing Modal**: Input for setting price in ETH (`ethers.parseEther`).
    - **Verification Modal**: Inspector document audit interface with deed viewer.
    - **Purchase Confirmation Modal**: ETH value warning and gas estimation notice.
  - Controls theme switching: reads/writes `darkMode` state to `localStorage` and toggles the `dark` class on the `<html>` root.
  - Handles transaction error parsing (extracting custom Solidity error names like `LandRegistry__AlreadyVerified`).

---

## 5. UI/UX Features & Design System

1. **Light / Dark Theme Support**:
   - Implemented with full Tailwind CSS class pairs (e.g. `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`).
   - Default theme is modern high-contrast Light Mode with glassmorphic cards and subtle emerald accents.
2. **Interactive States**:
   - Loading skeletons and animated spinners (`lucide-react: Loader2`) during contract transactions and IPFS uploads.
   - Toast notification banners displaying transaction hashes with direct block explorer links.
   - Badge indicators: Verified (Green), Pending Verification (Yellow), Listed for Sale (Blue), Private / Not for Sale (Gray).
