# 13. AI Handover & Implementation Guide

## 1. Context and Mission

This document serves as the technical handover guide for the AI agent or developer assigned to implement the UI/UX, theme compatibility, and visual consistency improvements for **TerraChain (LandBlock)**.

The preceding audit established that while the underlying blockchain, smart contract, and authentication systems are fully functional, the user interface suffers from:
1. Broken theme switching when operating on a Light OS (`tailwind.config.js` missing `darkMode: 'class'`).
2. Flash of unstyled content (FOUC) on page reload.
3. Unreadable status badges in Light Mode (< 2.8:1 contrast).
4. Vertical modal overflow blocking form submissions on laptops.
5. Inconsistent typography, component duplication, and orphaned legacy files.

---

## 2. Codebase Architecture & File Map

```
c:\LandBlock\
├── frontend/
│   ├── index.html                   # HTML entry point (needs FOUC pre-render script)
│   ├── tailwind.config.js           # Tailwind config (MUST add darkMode: 'class')
│   ├── package.json                 # Dependencies (React 18, Vite 5, Lucide, Tailwind 3)
│   └── src/
│       ├── index.css                # Global styles (fix selection color and scrollbars)
│       ├── main.jsx                 # React root DOM mount
│       ├── App.jsx                  # Main router; currently manages theme state in useState
│       ├── components/
│       │   ├── LandingPage.jsx      # Public landing page and marketing hero
│       │   ├── RoleLoginPage.jsx    # Unified role authentication interface
│       │   ├── AdminDashboard.jsx   # System admin & role management portal
│       │   ├── InspectorDashboard.jsx # Land surveyor / verification queue portal
│       │   ├── RegistrarDashboard.jsx # Sub-registrar title deed minting portal
│       │   ├── CitizenDashboard.jsx # Citizen property portfolio & marketplace
│       │   ├── ProtectedRoute.jsx   # Role-guard wrapper (currently hardcoded dark)
│       │   ├── LoginPage.jsx        # [DEPRECATED / UNUSED] Legacy prototype (safe to remove)
│       │   └── DocumentUploader.jsx # [DEPRECATED / UNUSED] Inline uploads used instead
│       ├── context/                 # (RECOMMENDED: Create ThemeContext.jsx here)
│       ├── services/                # api.js and contract.js (DO NOT MODIFY LOGIC)
│       └── utils/                   # web3.js, constants.js, exportHelpers.js
├── backend/                         # Node.js Express server on port 5000 (DO NOT MODIFY)
└── blockchain/                      # Hardhat contracts and deployment scripts
```

---

## 3. High-Priority Defect Checklist for Implementation

| Priority | Issue ID | Target File | Line Ref | Required Change |
|---|---|---|---|---|
| **P0** | `UI-001` | `frontend/tailwind.config.js` | Line 3 | Add `darkMode: 'class'` to export configuration. |
| **P0** | `UI-002` | All 4 Dashboards | Various | Replace translucent badges with dual-theme classes (`bg-amber-100 text-amber-900 ... dark:text-amber-400`). |
| **P0** | `UI-003` | `CitizenDashboard.jsx` | Line 425 | Add `max-h-[85vh] flex flex-col` to modal wrapper and `overflow-y-auto` to form field container. |
| **P1** | `UI-004` | `ProtectedRoute.jsx` | Lines 16–45 | Replace hardcoded `bg-slate-950` with adaptive `bg-slate-50 dark:bg-slate-950`. |
| **P1** | `UI-005` | `App.jsx` & Navigation | Line 104 | Move `.dark` class to `document.documentElement`. Create a dedicated `ThemeContext`. |
| **P1** | `UI-006` | `frontend/index.html` | Head | Add inline `<script>` to check `localStorage.getItem('terra_theme')` and set `dark` before paint. |
| **P1** | `UI-007` | `CitizenDashboard.jsx` | Line 220 | Add `overflow-x-auto whitespace-nowrap` to tab container for mobile viewports. |
| **P2** | `UI-008` | `InspectorDashboard.jsx` | Line 225 | Standardize Inspector action buttons to `text-white font-bold` to eliminate the hazard-button look. |
| **P2** | `UI-009` | All Dashboards | Various | Add `aria-label` to all icon-only buttons (theme toggle, close buttons, table view buttons). |
| **P3** | `UI-011` | `frontend/src/index.css` | Line 34 | Change `::selection` background from `#4f46e5` (indigo) to `#10b981` (emerald). |

---

## 4. Implementation Phasing & Step-by-Step Instructions

### Step 1: Fix Core Theme Engine (Immediate First Step)
1. In [`frontend/tailwind.config.js`](file:///c:/LandBlock/frontend/tailwind.config.js):
   ```javascript
   export default {
     darkMode: 'class', // <--- Add this line
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     ...
   ```
2. In [`frontend/index.html`](file:///c:/LandBlock/frontend/index.html), add this pre-hydration script directly inside `<head>` before any stylesheet links:
   ```html
   <script>
     (function() {
       try {
         const theme = localStorage.getItem('terra_theme');
         if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
           document.documentElement.classList.add('dark');
         } else {
           document.documentElement.classList.remove('dark');
         }
       } catch (e) {}
     })();
   </script>
   ```

### Step 2: Create `ThemeContext.jsx` and Clean up Prop Drilling
1. Create `frontend/src/context/ThemeContext.jsx` to encapsulate:
   - Initial state read from `localStorage`.
   - `toggleTheme` function that toggles `document.documentElement.classList.toggle('dark')` and writes to `localStorage.setItem('terra_theme', ...)`.
2. Wrap `<App />` in `<ThemeProvider>` in `main.jsx`.
3. Remove manual prop drilling of `isDarkMode` and `toggleTheme` from `App.jsx` routes. Use `const { isDarkMode, toggleTheme } = useTheme();` in navigation bars.

### Step 3: Implement Reusable `<StatusBadge />`
Create a centralized `frontend/src/components/common/StatusBadge.jsx`:
```jsx
export function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
    verified: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    approved: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    rejected: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
    certified: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
  };
  const key = (status || '').toLowerCase();
  const applied = styles[key] || 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${applied}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
}
```
Replace the hardcoded spans in `AdminDashboard.jsx`, `InspectorDashboard.jsx`, `RegistrarDashboard.jsx`, and `CitizenDashboard.jsx` with `<StatusBadge status={...} />`.

### Step 4: Fix Modal Layouts & Scrolling
In `CitizenDashboard.jsx` and `RegistrarDashboard.jsx`, wrap modal dialog cards with:
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
  <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
    {/* Header: fixed */}
    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
      ...
    </div>
    {/* Body: scrollable */}
    <div className="p-6 overflow-y-auto space-y-4">
      ...
    </div>
    {/* Footer: fixed */}
    <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
      ...
    </div>
  </div>
</div>
```

---

## 5. Regression Risks & Things NOT to Touch

> [!CAUTION]
> **Preserve Blockchain & Auth State Integrity:**
> 1. **Do not modify form field names or data structures:** Field IDs such as `propertyId`, `surveyNumber`, `area`, `marketValue`, and `documentHash` map directly to parameters expected by `contract.js` and `api.js`.
> 2. **Do not remove or rename state hooks:** State variables such as `properties`, `loading`, `error`, `selectedProperty`, `txHash` are tied to asynchronous Web3 and Axios calls.
> 3. **Do not touch backend controllers or Hardhat contracts:** All changes must remain strictly in `frontend/src/` styling, markup, and layout.
> 4. **Keep existing routes unchanged:** Do not rename `/admin`, `/inspector`, `/registrar`, or `/citizen`.

---

## 6. Local Testing & Verification Environment

Use these running services and credentials to test your UI updates:

### Service URLs:
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **Hardhat RPC:** `http://127.0.0.1:8545`

### Pre-Configured Test Accounts (Password for all: `Admin@12345` / `Role@12345`):
- **Admin:** `admin@terrachain.gov` / `Admin@12345`
- **Land Inspector:** `inspector@terrachain.gov` / `Inspector@12345`
- **Sub-Registrar:** `registrar@terrachain.gov` / `Registrar@12345`
- **Citizen:** `citizen@terrachain.gov` / `Citizen@12345` (or `rajesh@gmail.com`)

### Verification Checklist:
- [ ] Toggle theme in Light Mode: Backgrounds turn dark slate (`#020617`), cards turn `#0f172a`.
- [ ] Toggle theme in Dark Mode: Backgrounds turn light slate (`#f8fafc`), cards turn white.
- [ ] Refresh page in Dark Mode: Zero white flash (FOUC).
- [ ] Status badges legible on white backgrounds (WCAG contrast ≥ 4.5:1).
- [ ] Open Property Registration Modal on a laptop resolution (1366×768): Submit button is visible and clickable.
- [ ] View Citizen Dashboard on 360px mobile: Navigation tabs scroll horizontally without squishing.
- [ ] Trigger an unauthorized navigation: `ProtectedRoute` renders in the active theme.
