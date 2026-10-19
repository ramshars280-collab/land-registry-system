import React from "react";
import { CheckCircle2, Clock, Stamp, ShoppingCart, AlertCircle, Shield, Building2, FileCheck2, Users } from "lucide-react";

/**
 * StatusBadge Component
 *
 * Implements WCAG 2.1 AA compliant status pills for both Light and Dark themes.
 * All color combinations exceed the 4.5:1 contrast requirement for normal text:
 * - Light Mode: Uses 800/900 shade text on 100 shade backgrounds with 300 shade borders.
 * - Dark Mode: Uses 400 shade text on 500/15 translucent backgrounds with 500/30 borders.
 */

const STATUS_CONFIGS = {
  // Pending States
  pending: {
    label: "Pending Verification",
    icon: Clock,
    className: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  "pending audit": {
    label: "Pending Audit",
    icon: Clock,
    className: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  "pending inspection": {
    label: "Pending Inspection",
    icon: Clock,
    className: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },

  // Verified States
  verified: {
    label: "Verified on Chain",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  "verified title": {
    label: "Verified Title",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  "verified on chain": {
    label: "Verified on Chain",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  "verified by inspector": {
    label: "Verified by Inspector",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },

  // Certified States
  certified: {
    label: "Legally Certified",
    icon: Stamp,
    className: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  "legally certified": {
    label: "Legally Certified",
    icon: Stamp,
    className: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    dotClass: "bg-purple-500",
  },

  // Marketplace / Listed
  listed: {
    label: "Listed for Sale",
    icon: ShoppingCart,
    className: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  "listed for sale": {
    label: "Listed for Sale",
    icon: ShoppingCart,
    className: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    dotClass: "bg-blue-500",
  },

  // Rejected / Revoked
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    className: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  revoked: {
    label: "Revoked",
    icon: AlertCircle,
    className: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
    dotClass: "bg-rose-500",
  },

  // Role Badges
  inspector: {
    label: "Land Inspector",
    icon: Building2,
    className: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  registrar: {
    label: "Sub-Registrar",
    icon: FileCheck2,
    className: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  admin: {
    label: "Administrator",
    icon: Shield,
    className: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  citizen: {
    label: "Citizen",
    icon: Users,
    className: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    dotClass: "bg-blue-500",
  },
};

export default function StatusBadge({
  status,
  label,
  showIcon = false,
  showDot = true,
  size = "sm",
  className = "",
}) {
  const normalizedKey = (status || "").toString().trim().toLowerCase();
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: label || status || "Unknown",
    icon: null,
    className: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  };

  const displayText = label || config.label || status;
  const IconComponent = config.icon;

  const sizeClasses =
    size === "xs"
      ? "text-[10px] px-2 py-0.5"
      : size === "md"
      ? "text-xs px-3 py-1"
      : "text-[11px] px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full font-bold uppercase tracking-wider border transition-colors ${config.className} ${sizeClasses} ${className}`}
    >
      {showIcon && IconComponent && <IconComponent className="h-3 w-3 shrink-0" />}
      {showDot && !showIcon && (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotClass}`} />
      )}
      <span>{displayText}</span>
    </span>
  );
}
