# 07. Component-Level Findings Audit

## 1. Executive Summary

This report provides a granular, component-by-component visual and UX audit across all reusable elements, navigation bars, stat cards, data tables, modals, form controls, tabs, and feedback elements in the TerraChain (LandBlock) interface. 

Each component is evaluated across:
- **Default, Hover, Active, Focus, and Disabled States**.
- **Light Mode vs. Dark Mode behavior**.
- **Layout robustness and overflow handling**.
- **Source file references and exact line numbers**.

---

## 2. Navigation & Header Components

### 2.1 Dashboard Navigation Bar
- **Source Files:**
  - [`AdminDashboard.jsx`](file:///c:/LandBlock/frontend/src/components/AdminDashboard.jsx#L88-L135)
  - [`InspectorDashboard.jsx`](file:///c:/LandBlock/frontend/src/components/InspectorDashboard.jsx#L90-L140)
  - [`RegistrarDashboard.jsx`](file:///c:/LandBlock/frontend/src/components/RegistrarDashboard.jsx#L85-L130)
  - [`CitizenDashboard.jsx`](file:///c:/LandBlock/frontend/src/components/CitizenDashboard.jsx#L102-L155)

#### Defects & Observations:
1. **Code Duplication & Lack of Shared Component:**
   - Every single dashboard re-implements its own 40-line navigation bar with nearly identical markup (Logo icon, title, role badge, theme toggle button, wallet indicator, logout button).
   - If an enhancement is made to one navbar (such as adding a notification drawer or mobile menu), it must be manually copy-pasted across 4 distinct dashboard files.
2. **Theme Toggle Button Inconsistencies:**
   - In `AdminDashboard.jsx` (lines 105-115), the theme toggle button uses `p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`.
   - In `CitizenDashboard.jsx` (lines 120-128), it uses `p-2.5 rounded-lg`.
   - The button lacks an explicit `aria-label` across all dashboards, causing accessibility scanners to flag it as an unlabelled interactive control.
3. **Wallet Address Pill Truncation:**
   - Navbars display the user's Ethereum address or identity using `font-mono text-xs`.
   - On viewports below 768px, the wallet pill overflows the header or collides with the Logout button.
   - None of the navbars feature a "Click to Copy" interaction or a tooltip indicating the full address.
4. **Sticky Header Backdrop Blur Degradation:**
   - Navbars specify `sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-950/80`.
   - In Dark Mode, when scrolling over bright elements or charts, text underneath shows through with insufficient opacity, creating visual noise behind navbar text.

---

## 3. Stat Cards & Metric Tiles

### 3.1 Dashboard Metric Grid
- **Source Files:**
  - [`AdminDashboard.jsx:L155-L198`](file:///c:/LandBlock/frontend/src/components/AdminDashboard.jsx#L155-L198)
  - [`InspectorDashboard.jsx:L160-L200`](file:///c:/LandBlock/frontend/src/components/InspectorDashboard.jsx#L160-L200)
  - [`RegistrarDashboard.jsx:L145-L185`](file:///c:/LandBlock/frontend/src/components/RegistrarDashboard.jsx#L145-L185)
  - [`CitizenDashboard.jsx:L175-L215`](file:///c:/LandBlock/frontend/src/components/CitizenDashboard.jsx#L175-L215)

#### Defects & Observations:
1. **Card Border Contrast in Dark Mode:**
   - Cards use `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800`.
   - Contrast between `bg-slate-900` (`#0f172a`) and `border-slate-800` (`#1e293b`) is very low (1.2:1). In low-light environments, the cards lose edge definition and merge into the surrounding page.
2. **Stat Counter Typography:**
   - Stat numbers are rendered with `text-3xl font-black text-slate-900 dark:text-white`.
   - Large numbers (e.g., total property valuations such as `₹14,500,000` or large sq ft areas) overflow the card bounding box on mobile viewports (360px–390px).
3. **Trend Badges / Secondary Information:**
   - Some stat cards include percentage change pills (`+12% this month`), but their text color (`text-emerald-500`) has inadequate contrast in Light Mode against `bg-emerald-500/10` (2.8:1).

---

## 4. Tables and Data Grids

### 4.1 Implementation Overview
- Data tables are the core operational surface for Land Inspectors (surveys), Sub-Registrars (approvals), and Admins (user permissions).
- **Source Files:**
  - `AdminDashboard.jsx`: User Access Table (Lines 240–340)
  - `InspectorDashboard.jsx`: Survey Queue Table (Lines 210–310)
  - `RegistrarDashboard.jsx`: Title Deeds Queue Table (Lines 195–290)
  - `CitizenDashboard.jsx`: My Properties Table (Lines 230–315)

#### Defects & Observations:
1. **Missing Horizontal Scroll Affordance on Mobile:**
   - Tables are wrapped in `<div className="overflow-x-auto">`. However, on mobile screens there is no visual indicator (such as a gradient edge fade or scroll hint) signaling that 4 additional columns exist off-screen. Users frequently miss action buttons located in the rightmost column.
2. **Table Header Washout in Light Mode:**
   - Headers use `bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]`.
   - In Light Mode, `bg-slate-50` matches the page background color. When the card has no heavy shadow, the table header appears detached from the table body.
3. **Empty States in Tables:**
   - When no records exist (e.g., zero pending surveys), the table renders an inline message:
     ```html
     <tr>
       <td colSpan="6" className="py-12 text-center text-slate-400">
         No pending records found
       </td>
     </tr>
     ```
   - This lacks an icon, guidance, or actionable trigger (e.g., "Refresh Queue" or "Switch Filter").
4. **Action Button Density:**
   - Tables place 2–3 buttons per row (`View Details`, `Verify`, `Reject`).
   - The buttons lack consistent spacing (`space-x-1` vs `gap-2`). On touch screens, touch targets are as small as 26px × 24px, violating mobile tap target recommendations (minimum 44px × 44px).

---

## 5. Modal Dialogs and Overlays

### 5.1 Modal Implementation
- **Source Files:**
  - Property Registration Modal: [`CitizenDashboard.jsx:L420-L580`](file:///c:/LandBlock/frontend/src/components/CitizenDashboard.jsx#L420-L580)
  - Verification & Inspection Modal: [`InspectorDashboard.jsx:L380-L490`](file:///c:/LandBlock/frontend/src/components/InspectorDashboard.jsx#L380-L490)
  - Mint Deed / Title Transfer Modal: [`RegistrarDashboard.jsx:L320-L430`](file:///c:/LandBlock/frontend/src/components/RegistrarDashboard.jsx#L320-L430)
  - Add User Modal: [`AdminDashboard.jsx:L360-L460`](file:///c:/LandBlock/frontend/src/components/AdminDashboard.jsx#L360-L460)

#### Defects & Observations:
1. **Aggressive Backdrop Dimming in Light Mode:**
   - Modals use `fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4`.
   - While `bg-slate-950/80` creates great contrast in Dark Mode, in Light Mode it plunges the entire user workspace into total darkness with an 80% black sheet, creating a harsh, jarring transition.
2. **Scroll Lock Defect:**
   - Opening a modal does not apply `overflow: hidden` to `document.body`.
   - Users can scroll the dashboard behind the open modal, causing visual confusion and potential accidental interaction with obscured background elements.
3. **Vertical Viewport Overflow on Small Screens:**
   - The Property Registration Modal contains 10+ form fields (Survey Number, District, Taluka, Area, Valuation, Document Hash, Coordinates).
   - On laptop screens (1366 × 768) and mobile phones, the modal exceeds screen height. The modal lacks an internal `max-h-[85vh] overflow-y-auto` container, causing the bottom action buttons (`Submit Application`, `Cancel`) to be pushed off-screen and rendered unreachable.
4. **Modal Close (Esc Key & Backdrop Click):**
   - Several modals do not support closing via the `Escape` keyboard key.
   - Clicking the outer backdrop closes the modal without warning, immediately clearing all entered form data if a user accidentally clicks 2 pixels outside the modal card boundary.

---

## 6. Form Controls and Inputs

### 6.1 Text Fields, Number Inputs, and Select Boxes
- **Source Files:** Form sections across all modals and `RoleLoginPage.jsx`.

#### Defects & Observations:
1. **Focus Rings Visual Contrast:**
   - Form inputs use `focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none`.
   - The focus ring alpha (`/20`) is barely visible in bright sunlight or on uncalibrated monitors. In Dark Mode against `bg-slate-950`, it provides only subtle feedback.
2. **Native `<select>` Dropdown Option Styling:**
   - State and District dropdowns use native HTML `<select>`:
     ```html
     <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 ...">
       <option value="residential">Residential</option>
     </select>
     ```
   - While the `<select>` box adapts to dark mode, native `<option>` tags on Windows/Chrome render with hardcoded white backgrounds and dark text. On some browser configurations, opening the menu shows white flyout panels that clash with the dark interface.
3. **Number Steppers on Coordinate and Area Inputs:**
   - Inputs of type `number` do not hide standard browser spinner arrows (`[appearance:textfield]`), causing unsightly stepper buttons that overlap input padding on Firefox and WebKit.
4. **Helper Text & Inline Validation:**
   - Inputs lack dedicated helper text containers. When a validation error occurs, text shifts dynamically, pushing form elements downward and causing layout shifts (CLS).

---

## 7. Tabs and Filter Controls

### 7.1 Filter Bar Implementation
- **Source Files:**
  - Citizen Dashboard Tabs: [`CitizenDashboard.jsx:L220-L245`](file:///c:/LandBlock/frontend/src/components/CitizenDashboard.jsx#L220-L245)
  - Inspector Filter Tabs: [`InspectorDashboard.jsx:L205-L225`](file:///c:/LandBlock/frontend/src/components/InspectorDashboard.jsx#L205-L225)

#### Defects & Observations:
1. **Horizontal Tab Squishing on Mobile:**
   - `CitizenDashboard.jsx` displays 4 tabs: `"My Properties"`, `"Marketplace"`, `"Pending Applications"`, `"Transfer Requests"`.
   - In mobile viewports (`360px–390px`), the tab container forces tabs into flex rows without wrapping or horizontal scrolling, causing button labels to truncate or wrap mid-word (`Pending Applic...`).
2. **Active Tab Indicator Consistency:**
   - Citizen Dashboard active tab: `bg-blue-600 text-white shadow-lg shadow-blue-500/20`.
   - Inspector Dashboard active tab: `bg-amber-500 text-slate-950 font-black`.
   - Admin Dashboard active tab: `border-b-2 border-emerald-500 text-emerald-600`.
   - Each dashboard uses a completely different tab design pattern (Pill button vs. Underline tab vs. Glowing card).

---

## 8. Toast Notifications and Alert Banners

### 8.1 Status Notifications
- **Source Files:**
  - In-page alerts across all dashboards (e.g., `error && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">`).
  - React Hot Toast / Custom notification toasts.

#### Defects & Observations:
1. **Alert Banner Contrast:**
   - Error banners use `bg-rose-500/10 border border-rose-500/20 text-rose-500`.
   - In Light Mode, `text-rose-500` against white or light gray has a contrast ratio of only **3.6:1**, failing WCAG AA requirements for normal text. It needs `text-rose-700` in light mode.
2. **Missing Dismiss Button:**
   - Error and success alert banners rendered at the top of forms lack a close/dismiss (`×`) button. They remain permanently visible until the state is manually cleared or the page is refreshed.
3. **Hardcoded Dark Theme in Floating Toasts:**
   - Any floating notifications retain hardcoded `bg-slate-900 text-white border-slate-800` even when the user is operating in Light Mode.

---

## 9. Orphaned Components

### 9.1 `LoginPage.jsx` (525 Lines)
- **File:** [`frontend/src/components/LoginPage.jsx`](file:///c:/LandBlock/frontend/src/components/LoginPage.jsx)
- **Status:** Unused / Dead Code.
- **Audit Findings:**
  - This component is a legacy prototype that includes hardcoded private keys, simulated account switching, and obsolete styling.
  - It is not imported in `App.jsx` or any active route.
  - Leaving it in the source tree creates confusion for future developers and potential security auditor flags.

### 9.2 `DocumentUploader.jsx` (361 Lines)
- **File:** [`frontend/src/components/DocumentUploader.jsx`](file:///c:/LandBlock/frontend/src/components/DocumentUploader.jsx)
- **Status:** Unused / Orphaned.
- **Audit Findings:**
  - Dashboards implement their own inline document file upload handling instead of importing this dedicated component.
  - The component has completely hardcoded dark styles (`bg-slate-900 text-white`) and would fail immediately if imported into a Light Mode view.
