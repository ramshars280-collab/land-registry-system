import React from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

/**
 * ToastNotification Component
 *
 * Theme-adaptive notification card providing high contrast in both Light and Dark themes.
 * Employs clean white elevated surfaces in Light Mode and deep slate surfaces in Dark Mode,
 * bordered with semantic status colors (emerald, rose, blue).
 */
export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const type = toast.type || "info";

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/40 dark:border-emerald-500/40",
      accentBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/40 dark:border-rose-500/40",
      accentBg: "bg-rose-500/10 dark:bg-rose-500/15",
    },
    pending: {
      icon: Loader2,
      iconColor: "text-blue-600 dark:text-blue-400 animate-spin",
      border: "border-blue-500/40 dark:border-blue-500/40",
      accentBg: "bg-blue-500/10 dark:bg-blue-500/15",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/40 dark:border-blue-500/40",
      accentBg: "bg-blue-500/10 dark:bg-blue-500/15",
    },
  }[type] || {
    icon: Info,
    iconColor: "text-slate-500",
    border: "border-slate-300 dark:border-slate-700",
    accentBg: "bg-slate-100 dark:bg-slate-800",
  };

  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`p-4 rounded-2xl border shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-start space-x-3 ${config.border}`}
      >
        <div className={`p-1.5 rounded-xl shrink-0 ${config.accentBg} ${config.iconColor}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex-1 text-xs pr-1">
          <p className="font-bold text-slate-900 dark:text-white">{toast.title}</p>
          {toast.message && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
