# 12. Visual Verification Log

## 1. Audit Environment & Inspection Scope

Visual and structural inspections were conducted against the live, running development environment of TerraChain (LandBlock).

### Environment Parameters:
- **Frontend Server:** Vite 5.4.14 running at `http://localhost:3000` (Task ID: `task-43`)
- **Backend API:** Express / Node.js running at `http://localhost:5000` (Task ID: `task-985`)
- **Blockchain Node:** Hardhat Local RPC at `http://127.0.0.1:8545` (Task ID: `task-37`)
- **Inspection Tools:** Chrome DevTools, Playwright Browser Runner, DOM tree element inspection, CSS Computed Style Inspector.
- **Operating System Environment:** Windows 10/11 (Defaulting to Light Theme).

---

## 2. Tested Routes and Pages Matrix

| Route | Page / View | Inspection Method | Light Mode | Dark Mode | Status / Observations |
|---|---|---|---|---|---|
| `/` | Landing Page | Live Browser & Static DOM | Inspected | Inspected | Hero renders well; text selection indigo clash confirmed. |
| `/login` | Role Authentication | Live Browser & Static DOM | Inspected | Inspected | Role switcher works; error banner contrast fails in Light Mode. |
| `/admin` | Admin Dashboard | Authenticated Live Browser | Inspected | Inspected | User access table inspected; theme toggle audited; status badges verified. |
| `/inspector` | Inspector Dashboard | Authenticated Live Browser | Inspected | Inspected | Amber buttons verified; survey filter bar tested; table inspected. |
| `/registrar` | Registrar Dashboard | Authenticated Live Browser | Inspected | Inspected | Mint deed modal height audited; approval queue inspected. |
| `/citizen` | Citizen Dashboard | Authenticated Live Browser | Inspected | Inspected | Registration modal vertical overflow confirmed; tabs checked. |
| `/marketplace` | Marketplace Listings | Live Browser & Static DOM | Inspected | Inspected | Property card grid and price tags audited. |
| `/unauthorized` | ProtectedRoute Fallback | Live Browser & Static DOM | Inspected | Inspected | Hardcoded dark background confirmed on light theme. |
| `*` | 404 / Catch-all | Static Inspection | N/A | N/A | Missing dedicated branded 404 view. |

---

## 3. Viewport Testing Matrix

| Viewport Category | Resolution (W × H) | Layout Stability | Breakpoint Triggers | Identified Visual Defects |
|---|---|---|---|---|
| **Small Mobile** | **360 × 640 px** | Degraded | `sm` | - Citizen tab bar squishes and overflows horizontally.<br>- Stat numbers collide with card borders.<br>- Table action buttons are difficult to tap accurately. |
| **Typical Mobile** | **390 × 844 px** | Acceptable | `sm` | - Property Registration Modal submit button falls below screen fold.<br>- Navbar wallet address pill wraps awkwardly. |
| **Tablet Portrait** | **768 × 1024 px** | Good | `md` | - Grid transitions from 1 column to 2 columns.<br>- Stat card metrics display comfortably. |
| **Tablet Landscape**| **1024 × 768 px** | Good | `lg` | - Sidebar / header alignment stable.<br>- Table horizontal scrollbar becomes unnecessary for standard columns. |
| **Standard Desktop**| **1440 × 900 px** | Excellent | `xl` | - Default primary presentation.<br>- Full data tables render without clipping. |
| **Large Desktop** | **1920 × 1080 px** | Good | `2xl` | - Max-width container (`max-w-7xl`, 1280px) leaves large empty gutters on extreme left and right margins. |

---

## 4. Theme Switching Reproduction Log

### Test Case TS-01: Toggle Dark Mode on Light OS
- **Initial State:** Operating system set to Light Mode. Browser opens `http://localhost:3000`.
- **Action:** User clicks Sun/Moon toggle button in navigation bar.
- **Observed Behavior:**
  - React state `isDarkMode` changes from `false` to `true`.
  - The string `'dark'` is added to the container `<div>` class attribute.
  - **Result:** Background remains light slate (`#f8fafc`) and cards remain white (`#ffffff`). The dark mode styles fail to activate.
- **Root Cause Confirmed:** `frontend/tailwind.config.js` lacks `darkMode: 'class'`. Tailwind evaluates `@media (prefers-color-scheme: dark)` which is false on a Light OS.

### Test Case TS-02: Hard Page Reload (FOUC)
- **Initial State:** User operates in Dark Mode (`terra_theme = 'dark'` in `localStorage`).
- **Action:** User presses `Ctrl + F5` (Hard Reload) on the Citizen Dashboard.
- **Observed Behavior:**
  - Canvas renders solid white (`#ffffff`) for approximately 220ms while scripts download.
  - React boots, reads `localStorage`, and injects dark classes.
  - **Result:** A stark, blinding white strobe occurs on every page refresh.
- **Root Cause Confirmed:** Absence of pre-render inline `<script>` in `index.html`.

### Test Case TS-03: Modal Vertical Overflow
- **Initial State:** Browser resized to typical laptop height (768px). User logged into Citizen Dashboard.
- **Action:** User clicks `"Register New Property"` to open the modal.
- **Observed Behavior:**
  - The modal card expands to render all 12 form fields.
  - The overall modal height measures 890px.
  - The bottom section containing `"Submit Application"` and `"Cancel"` renders at Y=840px, off the bottom of the 768px viewport.
  - **Result:** The user cannot submit the registration form unless they use the mouse wheel to scroll the entire window down, which also scrolls the dashboard behind the modal.
- **Root Cause Confirmed:** Missing `max-h-[85vh]` and `overflow-y-auto` on modal inner wrapper.

---

## 5. Verification Limitations & Safety Boundaries

In accordance with strict audit-only guidelines:
1. **Zero Destructive Actions:** No smart contracts were deployed, no transactions were submitted to the blockchain, and no database records were purged.
2. **Zero File Modifications:** All verifications were read-only and observational; no CSS or JSX files were altered.
3. **Confirmed vs. Hypothesized:**
   - *Confirmed Defects:* Issues validated via DOM tree inspection and live browser runtime.
   - *Hypothesized / Unverified Concerns:* Low-level contrast of inactive input borders on uncalibrated TN monitors and behavior on legacy browsers (IE/older Safari) are categorized as design concerns rather than verified runtime bugs.
