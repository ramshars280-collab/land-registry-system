# 02. Dedicated Light Mode Visual & UX Audit

## 1. Executive Light Mode Assessment

In Light Mode, TerraChain presents a generally crisp, modern governmental aesthetic with an off-white background (`bg-slate-50`), white container cards (`bg-white`), and slate typography (`text-slate-900`). However, an in-depth audit reveals multiple severe visual flaws:
1. **Severe WCAG AA Contrast Failures on Badges and Statuses:** Warning and informational badges utilize mid-tone text colors (e.g. `text-amber-500` or `text-blue-500`) against very light background tints (`bg-amber-500/15`, `bg-blue-500/15`). Against a white container, these have contrast ratios as low as 2.4:1, failing the 4.5:1 minimum threshold.
2. **Hardcoded Dark Components Polluting Light Mode:** The loading and 403 Forbidden views in `ProtectedRoute.jsx`, all dashboard toast notifications, and `DocumentUploader.jsx` are hardcoded to dark slate (`bg-slate-950`, `bg-slate-900`), appearing completely disconnected from the light environment.
3. **Table Header & Container Washout:** Table headers use `bg-slate-50` with `text-slate-500`. On a page with `bg-slate-50`, the header completely dissolves into the page background, lacking distinct elevation or framing.
4. **Subtle / Invisible Borders:** In Light Mode, borders styled as `border-slate-100` or `border-slate-200` provide insufficient visual separation between nested cards and their parent containers.

---

## 2. Category-by-Category Light Mode Evaluation

### A. Text and Typography

| Element | Current Classes / Styling | Contrast Ratio (vs Background) | Compliance Status | Issue Description |
| :--- | :--- | :--- | :--- | :--- |
| **Page Headings (`h1`, `h2`)** | `text-slate-900` (`#0f172a`) on `bg-white` / `bg-slate-50` | 16.1:1 | **PASS** (AAA) | Excellent legibility, sharp font weight (`font-bold`, `font-extrabold`). |
| **Body & Card Text** | `text-slate-600` (`#475569`) on `bg-white` | 7.0:1 | **PASS** (AA) | Clear and readable. |
| **Muted Metadata & Captions** | `text-slate-400` (`#94a3b8`) on `bg-white` | 2.8:1 | **FAIL** (< 4.5:1) | Secondary helper text and dates are washed out and difficult to read in bright sunlight. |
| **Amber Badges ("Pending Verification")** | `text-amber-500` (`#f59e0b`) on `bg-amber-500/15` | **2.4:1** | **FAIL** (< 4.5:1) | Severe readability defect. Yellow-amber text on faint yellow tint is nearly illegible. |
| **Blue Badges ("Listed for Sale")** | `text-blue-600` (`#2563eb`) on `bg-blue-500/15` | 4.6:1 | **BORDERLINE** (AA) | Acceptable for bold text, but faints in smaller 10px sizes. |
| **Purple Badges ("Legally Certified")** | `text-purple-600` (`#9333ea`) on `bg-purple-500/15` | 5.2:1 | **PASS** (AA) | Good contrast. |
| **Input Placeholders** | Default browser gray / `placeholder-slate-400` | 3.1:1 | **FAIL** (< 4.5:1) | Input placeholder text in registration forms is too faint. |
| **Hex Hashes & Addresses** | `font-mono text-[11px] text-slate-800` | 10.5:1 | **PASS** | Good contrast, but lacks visual container styling (looks unstyled). |

### B. Backgrounds and Surfaces

1. **Page Canvas (`bg-slate-50` `#f8fafc`):**
   - Soft off-white canvas provides comfortable reading experience without glare.
2. **Card Containers (`bg-white` `#ffffff`):**
   - Clean elevation, but lacks sufficient border contrast against `bg-slate-50`.
3. **Table Containers & Headers:**
   - Table `<thead>` is styled with `bg-slate-50 text-slate-500` inside `AdminDashboard.jsx`, `InspectorDashboard.jsx`, and `RegistrarDashboard.jsx`. Because the page background is also `bg-slate-50`, table headers appear visually "cut open" and lack a distinct boundary.
4. **Nested Boxes (Deed PDF audit boxes):**
   - Styled with `bg-slate-50 border-slate-200`. In Light Mode, this looks clean, but the icons (`FileText`, `CheckCircle2`) lack consistent color framing.
5. **Modal Backdrops (`bg-slate-950/70 backdrop-blur-xs`):**
   - In Light Mode, this dark overlay (`950/70`) is excessively aggressive and creates an abrupt, jarring contrast transition when opening the Provisioning modal or Listing modal.

### C. Borders, Shadows, and Elevation

| Component | Border Styling | Shadow Styling | Evaluation in Light Mode |
| :--- | :--- | :--- | :--- |
| **Landing Role Cards** | `border-slate-200` | `hover:shadow-xl hover:shadow-slate-200/50` | Excellent interaction feel; subtle lift on hover. |
| **Dashboard Metric Cards** | `border-slate-200` | `shadow-xs` | Borders are very faint (`#e2e8f0`); cards slightly blend into the page. |
| **Tables** | `border-slate-200` | `shadow-xs` | Outer border is fine, but table rows use `divide-slate-100` (`#f1f5f9`), which is almost invisible. |
| **Form Inputs** | `border-slate-300` | `none` | Clean, clear boundaries (`#cbd5e1`). Focus ring (`focus:ring-2 focus:ring-emerald-500`) is crisp. |
| **Segmented Tab Switcher** | `bg-slate-200 border-slate-300` | Active tab: `bg-white shadow-xs` | High tactile clarity in Light Mode. Active tab pops out clearly. |

### D. Hardcoded Dark Components Polluting Light Mode

1. **`ProtectedRoute.jsx` Loading View (Line 12):**
   ```jsx
   <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
   ```
   **Defect:** When a user is in Light Mode and navigates to any dashboard, an unstyled dark flash (`bg-slate-900`) covers the entire viewport for 300–600ms while the session is verified.
2. **`ProtectedRoute.jsx` 403 Forbidden View (Line 29):**
   ```jsx
   <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-slate-100">
     <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
   ```
   **Defect:** If an unauthenticated or unauthorized role attempts to access a portal while in Light Mode, the error screen renders in jet-black dark mode (`bg-slate-950`), completely ignoring the user's active theme.
3. **Toast Notifications Across All Dashboards:**
   ```jsx
   toast.type === "success"
     ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
     : toast.type === "error"
     ? "bg-red-950/90 border-red-500/50 text-red-200"
     : "bg-blue-950/90 border-blue-500/50 text-blue-200"
   ```
   **Defect:** Toasts render with deep dark backgrounds (`bg-emerald-950`, `bg-red-950`) even in Light Mode. While high-contrast, they violate the Light Mode palette and feel like dark-mode widgets pasted into a light page.
4. **`DocumentUploader.jsx` (Lines 162–204):**
   **Defect:** Dropzone uses `border-slate-800 bg-slate-900/40 text-slate-100`. In Light Mode, it appears as a giant black block in the middle of a white form.

### E. Interactive Controls & Buttons

- **Primary Action Buttons:**
  - Emerald: `bg-emerald-600 hover:bg-emerald-500 text-white` (High contrast, 4.8:1, passes WCAG AA).
  - Amber (Inspector): `bg-amber-500 hover:bg-amber-400 text-slate-950 font-black` (Good decision: uses dark text `#020617` on amber background, achieving 8.2:1 contrast ratio).
  - Purple: `bg-purple-600 hover:bg-purple-500 text-white` (Passes AA).
  - Blue: `bg-blue-600 hover:bg-blue-500 text-white` (Passes AA).
- **Secondary / Ghost Buttons:**
  - `Sign Out` button: `border-slate-300 text-slate-700 hover:bg-slate-100`. Clean and legible in Light Mode.
- **Deactivate Button (`AdminDashboard.jsx`):**
  - Uses `text-red-600 hover:bg-red-50 p-2 rounded-lg`. Clear visual indication of destructive action.
