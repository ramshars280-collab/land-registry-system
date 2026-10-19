# 08. Accessibility and Usability Audit

## 1. Executive Summary

This report evaluates TerraChain (LandBlock) against **WCAG 2.1 Level AA** standards. As a mission-critical municipal and land registry platform handling legally binding property titles, digital deeds, and financial transactions, high accessibility is essential for civic compliance and universal usability.

The audit identifies several key accessibility deficiencies:
1. **Contrast Failures in Light Mode:** Status badges, muted metadata text, and error banners fail the minimum 4.5:1 contrast threshold.
2. **Icon-Only Buttons Lacking Accessible Names:** Theme toggles, modal close buttons, and table action shortcuts lack `aria-label` attributes.
3. **Modal Dialog Focus Trapping Deficiencies:** Modals do not trap keyboard focus, do not return focus upon closing, and can be escaped only via mouse.
4. **Form Inputs Missing Associated Labels:** Form fields lack programmatic `id`/`htmlFor` associations, relying solely on visual proximity.
5. **Touch Target Size Violations:** Multiple interactive buttons in data tables measure under 32px, below the recommended 44px minimum touch target size.

---

## 2. WCAG Contrast Analysis (Level AA)

WCAG 2.1 Criterion 1.4.3 requires a contrast ratio of at least:
- **4.5:1** for regular text (< 18pt or < 14pt bold).
- **3.0:1** for large text (≥ 18pt or ≥ 14pt bold) and essential graphical user interface components (borders of active inputs, icons).

### 2.1 Contrast Measurement Matrix

| Element / Component | Light Mode Hex & Ratio | Dark Mode Hex & Ratio | WCAG 2.1 AA Result | Root Cause / Note |
|---|---|---|---|---|
| **Primary Body Text** | `#0f172a` on `#ffffff` **(15.4:1)** | `#ffffff` on `#0f172a` **(15.4:1)** | ✅ PASS (Both) | Standard primary text is clear in both themes. |
| **Secondary Subtitles** (`text-slate-500`) | `#64748b` on `#ffffff` **(4.6:1)** | `#64748b` on `#0f172a` **(3.6:1)** | ⚠️ FAIL (Dark Mode) | In Dark Mode, `text-slate-500` is below 4.5:1 for regular text. Should use `text-slate-400` (`#94a3b8`, 7.3:1). |
| **Pending Status Badge** (`text-amber-500`) | `#f59e0b` on `#ffffff` **(2.4:1)** | `#f59e0b` on `#0f172a` **(5.8:1)** | ❌ FAIL (Light Mode) | Severe failure in Light Mode. Needs `text-amber-800` (`#92400e`, 5.9:1) on light surfaces. |
| **Verified Badge** (`text-emerald-500`) | `#10b981` on `#ffffff` **(2.8:1)** | `#10b981` on `#0f172a` **(6.1:1)** | ❌ FAIL (Light Mode) | Fails contrast on white cards. Needs `text-emerald-800` (`#065f46`, 6.5:1). |
| **Rejected Badge** (`text-rose-500`) | `#f43f5e` on `#ffffff` **(3.6:1)** | `#f43f5e` on `#0f172a` **(6.4:1)** | ❌ FAIL (Light Mode) | Fails 4.5:1 ratio. Needs `text-rose-700` (`#be123c`, 5.8:1). |
| **Certified Badge** (`text-purple-400`) | `#c084fc` on `#ffffff` **(2.1:1)** | `#c084fc` on `#0f172a` **(7.8:1)** | ❌ CRITICAL FAIL (Light) | In Light Mode, `text-purple-400` is nearly invisible on white paper backgrounds. |
| **Input Placeholder Text** (`placeholder:text-slate-400`) | `#94a3b8` on `#f8fafc` **(2.8:1)** | `#64748b` on `#020617` **(3.4:1)** | ❌ FAIL (Both) | Placeholder text lacks sufficient contrast for low-vision users. |
| **Input Inactive Border** (`border-slate-200` / `800`) | `#e2e8f0` on `#ffffff` **(1.2:1)** | `#1e293b` on `#0f172a` **(1.3:1)** | ⚠️ Non-Text Contrast Concern | Fails 3.0:1 requirement for form boundary perception without focus. |

---

## 3. Keyboard Navigation and Focus Management

### 3.1 Focus Indicators (`focus-visible`)
- **Observed Pattern:** 
  Most interactive elements apply Tailwind's `outline-none` alongside subtle focus rings:
  ```html
  <button className="outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
  ```
- **Defects:**
  1. `focus:ring-2 focus:ring-emerald-500/20`: The `20%` alpha opacity ring is virtually imperceptible when navigating using a physical keyboard, especially on high-resolution displays.
  2. In tables, row action buttons often omit focus styling entirely, rendering them invisible during keyboard Tab traversal.
  3. Custom tab switches in `CitizenDashboard.jsx` lack keyboard arrow key navigation (`ArrowRight` / `ArrowLeft` according to the WAI-ARIA Tabs pattern); they can only be reached via repeated Tab presses.

### 3.2 Modal Focus Trapping & Restoration
- When opening modals (such as the Property Registration Modal or Verification Modal):
  1. **Focus is not transferred into the modal:** Keyboard focus remains on the background trigger button. Pressing Tab scrolls the obscured dashboard in the background behind the modal overlay.
  2. **No Focus Trap:** A keyboard user can tab completely out of the modal into hidden footer links and header elements while the modal is open.
  3. **No Focus Restoration:** Closing a modal leaves keyboard focus lost at `document.body` rather than returning to the button that triggered the modal.
  4. **Escape Key Handling:** Pressing `Escape` does not dismiss modal overlays.

---

## 4. Forms and Assistive Technology (Screen Readers)

### 4.1 Label and Input Programmatic Association
- **Observed Pattern in Code:**
  ```html
  <div>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
      Survey Number / Khasra
    </label>
    <input
      type="text"
      placeholder="e.g. 104/2B"
      className="w-full bg-slate-100 dark:bg-slate-950 ..."
    />
  </div>
  ```
- **Defects:**
  - Neither `id` nor `htmlFor` is present.
  - Screen reader software (NVDA, VoiceOver, JAWS) announces these fields as generic `"edit text"` without vocalizing the associated field title.
  - Required fields are indicated visually by asterisks (`*`) or `required` attributes, but lack `aria-required="true"`.

### 4.2 Error Handling & Feedback
- Dynamic error banners are rendered conditionally:
  ```html
  {error && <div className="p-3 bg-rose-500/10 text-rose-500 text-sm">{error}</div>}
  ```
- These error containers omit `role="alert"` and `aria-live="assertive"`. Consequently, screen reader users who submit an invalid form receive zero audio feedback that an error occurred.

---

## 5. Screen Reader Accessible Names (ARIA)

### 5.1 Icon-Only Controls
A significant number of controls throughout TerraChain contain only Lucide SVG icons with no text node:
- **Theme Toggle Button:** Contains `<Sun className="w-5 h-5" />` or `<Moon className="w-5 h-5" />`. Contains no `aria-label="Toggle Dark/Light Mode"`.
- **Modal Close Buttons:** `<button onClick={onClose}><X className="w-5 h-5" /></button>`. Screen reader announces `"Button"`.
- **Table Action Shortcuts:** Buttons containing `<Eye />`, `<Check />`, `<X />` in table rows lack `aria-label="View parcel #104 details"`.
- **Copy Wallet Address Buttons:** Unlabelled icon buttons.

---

## 6. Touch Targets and Usability on Touch Devices

WCAG 2.5.5 (Level AAA) recommends a target size of **44 × 44 CSS pixels**; WCAG 2.1 Criterion 2.5.8 (Level AA in WCAG 2.2) requires at least **24 × 24 CSS pixels** with adequate spacing.

### 6.1 Findings on Touch Devices
1. **Data Table Action Buttons:**
   - Table buttons in `InspectorDashboard.jsx` and `RegistrarDashboard.jsx` are styled with `px-2.5 py-1 text-xs rounded-lg`.
   - The measured physical hit target is **28px wide × 22px high**, leading to frequent accidental taps on adjacent buttons (e.g., tapping "Reject" when intending to tap "View").
2. **Tab Bar Items on Mobile:**
   - In `CitizenDashboard.jsx`, the 4 tabs are compressed onto a single screen row on small phones, reducing their touch target width and causing tap interference.

---

## 7. Motion, Scaling, and Zoom Behavior

### 7.1 Text Zoom (200%)
- When browser zoom is set to 200% (WCAG 1.4.4 Resize Text):
  - Fixed-height cards (e.g., `h-32` or `max-h-60`) cause text to clip.
  - Modals without internal scrollbars expand beyond the viewport bounds, rendering submit buttons unreachable.
- Text containers that use `truncate` or `overflow-hidden` without title tooltips hide critical legal parcel data when zoomed.

### 7.2 Reduced Motion (`prefers-reduced-motion`)
- `frontend/src/index.css` applies smooth transitions globally:
  ```css
  * {
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  ```
- There is no `@media (prefers-reduced-motion: reduce)` override to disable or simplify transitions for users with vestibular or motion sensitivities.

---

## 8. Summary of Accessibility Recommendations

| Category | Priority | Action Item |
|---|---|---|
| **Contrast** | **P0** | Replace translucent badge classes with dual-token classes providing ≥ 4.5:1 contrast in both themes. |
| **ARIA / Names** | **P0** | Add `aria-label` to all icon-only buttons (theme toggle, modal close, table actions). |
| **Focus Trapping** | **P1** | Implement focus lock on all modals (`aria-modal="true"`, focus trap, Esc-key listener, restore focus). |
| **Form Labels** | **P1** | Add explicit `id` to all inputs and `htmlFor` to corresponding `<label>` tags. |
| **Screen Reader Alerts** | **P1** | Add `role="alert"` and `aria-live="polite"` to form validation messages. |
| **Touch Targets** | **P2** | Increase table action button padding to guarantee a minimum 44 × 44px tap zone on mobile. |
| **Reduced Motion** | **P3** | Add CSS media query to respect `prefers-reduced-motion`. |
