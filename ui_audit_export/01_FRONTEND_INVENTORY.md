# 01. Complete Frontend Inventory & Architecture Map

## 1. Technology Stack & Dependencies

| Category | Technology / Library | Version | Role in Application |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^18.3.1` | Component lifecycle, JSX rendering, and local UI state. |
| **DOM Renderer** | React DOM | `^18.3.1` | Client-side DOM mounting (`document.getElementById("root")`). |
| **Routing** | React Router DOM | `^7.18.4` | Client-side routing, nested routes, route protection guards, and URL redirects. |
| **Bundler & Dev Server** | Vite | `^5.4.11` | Hot module replacement, production minification, asset pipeline. |
| **CSS Framework** | Tailwind CSS | `^3.4.17` | Utility-first CSS styling. |
| **CSS Post-Processing** | PostCSS / Autoprefixer | `^8.4.49` / `^10.4.20` | Vendor prefixing and utility compilation. |
| **Iconography** | Lucide React | `^0.475.0` | SVG icons across headers, badges, buttons, metrics, and alerts. |
| **HTTP Client** | Axios | `^1.7.9` | REST API communication with Express backend (`http://localhost:5000/api`). |
| **Web3 & Blockchain** | Ethers.js | `^6.13.4` | JSON-RPC provider, browser provider, smart contract ABI invocation, unit formatting. |

---

## 2. Route & Visual Interface Inventory

The application defines 9 distinct top-level and nested routes inside `src/App.jsx`:

| Route Path | Page Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage.jsx` | Public | Role selection landing hub with 4 portal cards, protocol branding, and theme toggle. |
| `/admin/login` | `RoleLoginPage.jsx` (`role="admin"`) | Public | Dedicated authentication portal for Chief Administrator. |
| `/inspector/login` | `RoleLoginPage.jsx` (`role="inspector"`) | Public | Dedicated authentication portal for Government Land Inspector. |
| `/registrar/login` | `RoleLoginPage.jsx` (`role="registrar"`) | Public | Dedicated authentication portal for Sub-Registrar. |
| `/citizen/login` | `RoleLoginPage.jsx` (`role="citizen"`) | Public | Dedicated authentication portal for Citizens (Sign-in and Registration tabs). |
| `/admin/*` | `AdminDashboard.jsx` | Protected (`admin`) | Administrative console for officer provisioning, smart contract audit, and activity logs. |
| `/inspector/*` | `InspectorDashboard.jsx` | Protected (`inspector`) | Cadastral inspection desk, title deed PDF auditing, on-chain verification signing. |
| `/registrar/*` | `RegistrarDashboard.jsx` | Protected (`registrar`) | Sub-Registrar municipal endorsement desk for on-chain title deed legal certification. |
| `/citizen/*` | `CitizenDashboard.jsx` | Protected (`citizen`) | Marketplace, citizen property portfolio, parcel registration, and public title ledger. |
| `*` | `<Navigate to="/" replace />` | Public | Catch-all wildcard redirecting any invalid URL to the landing hub. |

---

## 3. Comprehensive Page-by-Page Component Breakdown

### 3.1 Landing Page (`LandingPage.jsx`)
* **File:** [`frontend/src/pages/LandingPage.jsx`](file:///c:/LandBlock/frontend/src/pages/LandingPage.jsx)
* **Route:** `/`
* **Purpose:** Serves as the primary public entry point, orienting users and routing them to their authorized role portal.
* **Major Visual Components:**
  1. **Sticky Header:** App branding logo (`Layers`), gradient wordmark (`TerraChain`), government badge pill, and theme toggle button (`Sun` / `Moon`).
  2. **Hero Header:** Security badge (`Lock`), `<h1>` title ("Authorized Land Registry Portals"), and descriptive subtitle.
  3. **4-Card Role Grid:**
     - Admin Card: Emerald theme, `Shield` icon, feature highlights, and CTA button.
     - Inspector Card: Amber theme, `Building2` icon, feature highlights, and CTA button.
     - Registrar Card: Purple theme, `FileCheck2` icon, feature highlights, and CTA button.
     - Citizen Card: Blue theme, `Users` icon, feature highlights, and CTA button.
  4. **Security Notice Banner:** Informational callout outlining the zero-trust security boundary.

### 3.2 Unified Role Login Page (`RoleLoginPage.jsx`)
* **File:** [`frontend/src/pages/RoleLoginPage.jsx`](file:///c:/LandBlock/frontend/src/pages/RoleLoginPage.jsx)
* **Routes:** `/admin/login`, `/inspector/login`, `/registrar/login`, `/citizen/login`
* **Purpose:** Single adaptive login and self-registration component customized by `role` prop.
* **Major Visual Components:**
  1. **Top Header:** Back navigation link ("← Back to All Portals") and theme toggle button.
  2. **Role Header Card:** Color-coded role avatar icon, portal title, official department badge.
  3. **Citizen Tab Switcher:** 2-segment segmented button toggling between "Sign In" and "Register Account" (citizen only).
  4. **Feedback Banners:** Dynamic error alert (`AlertCircle`) and success alert (`CheckCircle2`).
  5. **Sign-In Form:**
     - Username / Email input with `Mail` icon prefix.
     - Password input with `Lock` icon prefix and `Eye` / `EyeOff` visibility toggle button.
     - Role-themed primary submit button with spinner loading state (`Loader2`).
  6. **Citizen Registration Form (Citizen portal only):**
     - Full Legal Name input.
     - Username input.
     - Email address input.
     - Password input (min 8 chars).
     - Ethereum Wallet Address input with "Use Connected" quick-fill button.
     - Submit button ("Complete Citizen Registration").

### 3.3 Chief Administrator Dashboard (`AdminDashboard.jsx`)
* **File:** [`frontend/src/pages/AdminDashboard.jsx`](file:///c:/LandBlock/frontend/src/pages/AdminDashboard.jsx)
* **Route:** `/admin/*`
* **Purpose:** Master governance console for Chief Registrar General.
* **Major Visual Components:**
  1. **Console Header:** Government badge (`Shield`), user identity details (`Dr. Suresh Patil`), theme toggle, and Sign Out button.
  2. **Top Metric Summary Cards (3 Cards):**
     - Provisioned Officers count (`Users` icon).
     - Registered EVM Lands count (`Layers` icon).
     - Security Audit Events count (`Clock` icon).
  3. **Segmented Tab Navigation:** 3 tabs ("Officer Provisioning", "Security Audit Logs", "Smart Contract Registry").
  4. **Tab 1: Officer Provisioning Panel:**
     - Provision New Officer action button (`Plus`).
     - Officer Data Table: Name, Username, Role badge, Department, Wallet Address, Status, Deactivate button (`Trash2`), and Smart Contract Role Sync button (`Key`).
  5. **Tab 2: Security Audit Logs Table:**
     - Timestamp, Action Type badge, Actor Email, Resource/Target, Client IP, and Metadata inspector.
  6. **Tab 3: Smart Contract Land Registry Table:**
     - Parcel ID, Address, Area (sq ft), Price (ETH), Status badge, Owner address.
  7. **Modal: Provision Officer Modal (`isProvisionOpen`):**
     - Full Legal Name, Role select (`<select>`), Username, Email, Initial Password, Department, and Assigned Ethereum Wallet input fields.
  8. **Notification Toast:** Fixed bottom-right toast alert for transaction and action feedback.

### 3.4 Government Land Inspector Dashboard (`InspectorDashboard.jsx`)
* **File:** [`frontend/src/pages/InspectorDashboard.jsx`](file:///c:/LandBlock/frontend/src/pages/InspectorDashboard.jsx)
* **Route:** `/inspector/*`
* **Purpose:** Operational desk for Land Inspector to review cadastral documents and sign on-chain approvals.
* **Major Visual Components:**
  1. **Header:** Amber inspector branding (`Building2`), Officer name, Department, Theme toggle, Sign Out.
  2. **Top Metric Cards (2 Cards):**
     - Pending Title Verifications (`Clock` icon, amber accent).
     - Total Cadastral Records (`Layers` icon, blue accent).
  3. **Segmented Tab Switcher:** "Verification Desk" vs. "Certified Land Registry".
  4. **Tab 1: Pending Verification Desk:**
     - Empty State card (`CheckCircle2`) when no parcels are pending.
     - Parcel Audit Cards: Parcel ID, Area badge, Postal address (`MapPin`), Claimant Owner code block, IPFS Deed Audit box with external link (`FileText`, `ExternalLink`), and primary action button ("Sign On-Chain Title Deed Verification").
  5. **Tab 2: Certified Land Registry Table:**
     - Parcel ID, Cadastral Location, Area, Title Deed IPFS link, Status pill, and Registered Owner.
  6. **Notification Toast:** Toast popup for pending and completed verification transactions.

### 3.5 Sub-Registrar Dashboard (`RegistrarDashboard.jsx`)
* **File:** [`frontend/src/pages/RegistrarDashboard.jsx`](file:///c:/LandBlock/frontend/src/pages/RegistrarDashboard.jsx)
* **Route:** `/registrar/*`
* **Purpose:** Municipal legal endorsement desk for certifying verified property deeds on-chain.
* **Major Visual Components:**
  1. **Header:** Purple registrar branding (`FileCheck2`), Sub-Registrar identity, Theme toggle, Sign Out.
  2. **Top Metric Cards (2 Cards):**
     - Awaiting Title Certification (`Clock` icon, purple accent).
     - Total Registry Parcels (`Building` icon, blue accent).
  3. **Section Explainer Card:** Title and regulatory scope description.
  4. **Verified Lands Ledger Table:**
     - Parcel ID (`#id`), Location, Area, Title Deed link, Inspector Status badge, and Registrar Action ("Certify Title On-Chain" button / "Legally Certified" pill).
  5. **Notification Toast:** Bottom-right status toast.

### 3.6 Citizen Real Estate & Marketplace Dashboard (`CitizenDashboard.jsx`)
* **File:** [`frontend/src/pages/CitizenDashboard.jsx`](file:///c:/LandBlock/frontend/src/pages/CitizenDashboard.jsx)
* **Route:** `/citizen/*`
* **Purpose:** Public marketplace, property management, and land registration portal for citizens.
* **Major Visual Components:**
  1. **Header:** Blue branding (`Users`), user name, wallet connection pill / button (`Wallet`), Theme toggle, Sign Out.
  2. **4-Tab Navigation Bar:**
     - "Land Marketplace" (with dynamic count).
     - "My Properties" (with dynamic count).
     - "+ Register New Land".
     - "Public Title Ledger" (with dynamic count).
  3. **Search Bar:** Real-time text filter with `Search` icon for marketplace properties.
  4. **Tab 1: Marketplace Grid:**
     - Property Cards: Parcel ID, "Listed for Sale" badge, address, surface area, current owner, verified deed box, asking price in ETH, and "Buy Property with ETH" button.
     - Self-ownership guard: "You Own This Parcel" disabled button if the user is the seller.
  5. **Tab 2: My Properties Grid:**
     - Owned Property Cards: Verification and listing status pills, surface area, listing price.
     - Dynamic Action Buttons: "Awaiting Verification" note / "List for Sale on Marketplace" button / "Delist from Marketplace" button.
  6. **Tab 3: Register New Land Form:**
     - Postal survey address input.
     - Surface area (sq ft) input.
     - Optional initial valuation (ETH) input.
     - Drag-and-drop deed document upload dropzone with progress bar and IPFS CID preview.
     - Submit button ("Submit Land Registration to EVM").
  7. **Tab 4: Public Title Ledger Table:**
     - Complete immutable history of all registered lands on the smart contract.
  8. **Modal: Listing Price Modal (`listingModal`):**
     - Land ID prompt, asking price in ETH input field, Cancel and Confirm buttons.
  9. **Notification Toast:** Status toast for registrations, listings, and purchases.

---

## 4. Reusable & Shared Components Inventory

| Component | File Path | Usage & Current Status |
| :--- | :--- | :--- |
| `ProtectedRoute.jsx` | [`src/components/ProtectedRoute.jsx`](file:///c:/LandBlock/frontend/src/components/ProtectedRoute.jsx) | **Active.** Wraps `/admin/*`, `/inspector/*`, `/registrar/*`, `/citizen/*`. Renders loading spinner and 403 Access Forbidden view. |
| `DocumentUploader.jsx` | [`src/components/DocumentUploader.jsx`](file:///c:/LandBlock/frontend/src/components/DocumentUploader.jsx) | **Unused / Orphaned.** Contains rich drag-and-drop file upload with Pinata IPFS pinning and progress bar, but is not imported by any dashboard. |
| `LoginPage.jsx` | [`src/components/LoginPage.jsx`](file:///c:/LandBlock/frontend/src/components/LoginPage.jsx) | **Unused / Legacy.** Earlier mock login screen with 3 hardcoded roles and private keys. Superseded by `RoleLoginPage.jsx`. |

---

## 5. Global State & Services Inventory

| Module | File Path | Role |
| :--- | :--- | :--- |
| `AuthContext.jsx` | [`src/context/AuthContext.jsx`](file:///c:/LandBlock/frontend/src/context/AuthContext.jsx) | Authentication session state, `user`, `login`, `logout`, `registerCitizen`, `connectedAccount`. |
| `Web3Context.jsx` | [`src/context/Web3Context.jsx`](file:///c:/LandBlock/frontend/src/context/Web3Context.jsx) | Ethers provider, MetaMask listener, contract instance, wallet balance. |
| `authApi.js` | [`src/services/authApi.js`](file:///c:/LandBlock/frontend/src/services/authApi.js) | Axios endpoints for login, me, logout, officer management, audit logs. |
| `landApi.js` | [`src/services/landApi.js`](file:///c:/LandBlock/frontend/src/services/landApi.js) | Axios endpoints for server-mediated blockchain transactions and local document storage. |
| `pinataService.js` | [`src/services/pinataService.js`](file:///c:/LandBlock/frontend/src/services/pinataService.js) | Pinata IPFS API client for file and metadata pinning. |
| `ethereum.js` | [`src/utils/ethereum.js`](file:///c:/LandBlock/frontend/src/utils/ethereum.js) | Address truncator (`formatAddress`), provider and network switch helpers. |
| `ipfs.js` | [`src/utils/ipfs.js`](file:///c:/LandBlock/frontend/src/utils/ipfs.js) | IPFS upload wrapper with Pinata-to-local-storage fallback. |
