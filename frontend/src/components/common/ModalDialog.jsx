import React, { useEffect, useCallback, useRef, useId } from "react";
import { X } from "lucide-react";

/**
 * ModalDialog Component
 *
 * An accessible, responsive modal dialog that:
 * 1. Locks background scrolling on document.body while open.
 * 2. Constrains dialog height to 90vh on laptops and mobile devices.
 * 3. Keeps Header and Action Footer permanently pinned and accessible.
 * 4. Enables internal vertical scrolling for long form contents.
 * 5. Traps keyboard focus inside the dialog (Tab / Shift+Tab).
 * 6. Automatically moves focus to dialog on open and restores focus on close.
 * 7. Supports dismissing via Escape key without form submission or propagation.
 * 8. Implements WCAG 2.1 Dialog (Modal) semantics with aria-labelledby & aria-describedby.
 */
export default function ModalDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
  ariaLabel,
}) {
  const dialogRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  // Stable ref for onClose to avoid re-triggering effects when parent re-renders on keystrokes
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Track initial autofocus so it only happens once per modal open session
  const hasAutoFocusedRef = useRef(false);

  // Manage body scroll lock, initial focus, focus trap, and focus restoration
  useEffect(() => {
    if (!isOpen) {
      hasAutoFocusedRef.current = false;
      return;
    }

    // Save previous active element when opened
    previouslyFocusedElementRef.current = document.activeElement;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Stable keyboard handler using ref
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        if (onCloseRef.current) onCloseRef.current();
        return;
      }

      // Focus trap on Tab / Shift+Tab
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on first interactive element ONLY ONCE when modal opens
    let timer;
    if (!hasAutoFocusedRef.current) {
      hasAutoFocusedRef.current = true;
      timer = setTimeout(() => {
        if (dialogRef.current) {
          // Never steal focus if the user is already actively focused inside the dialog
          if (dialogRef.current.contains(document.activeElement)) {
            return;
          }

          const firstInteractive =
            dialogRef.current.querySelector(
              'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([aria-label="Close modal dialog"])'
            ) ||
            dialogRef.current.querySelector('button[aria-label="Close modal dialog"]') ||
            dialogRef.current;

          if (firstInteractive && typeof firstInteractive.focus === "function") {
            firstInteractive.focus();
          }
        }
      }, 50);
    }

    return () => {
      if (timer) clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      // Restore focus to trigger element on close
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === "function"
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Click backdrop to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} max-w-full max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Non-Scrolling Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h3
              id={titleId}
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
            >
              {title}
            </h3>
            {description && (
              <p
                id={descId}
                className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal"
              >
                {description}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              aria-label="Close modal dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-4 tc-focus-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {children}
        </div>

        {/* Pinned Non-Scrolling Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-950/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

