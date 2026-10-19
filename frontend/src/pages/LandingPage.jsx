import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Building2,
  FileCheck2,
  Users,
  ArrowRight,
  Lock,
  Layers,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import StatusBadge from "../components/common/StatusBadge";

export default function LandingPage({ isDarkMode, toggleTheme }) {
  const portals = [
    {
      role: "admin",
      title: "Chief Administrator Portal",
      badge: "Directorate General of Land Records",
      path: "/admin/login",
      color: "emerald",
      icon: Shield,
      description: "Manage system governance, officer provisioning, and inspect master security audit logs.",
      highlights: [
        "Cryptographic Officer Provisioning",
        "Smart Contract Role Synchronization",
        "System-Wide Transaction Oversight",
      ],
    },
    {
      role: "inspector",
      title: "Land Inspector Portal",
      badge: "Survey & Cadastral Inspection Bureau",
      path: "/inspector/login",
      color: "amber",
      icon: Building2,
      description: "Audit title deed PDFs and survey blueprints pinned to IPFS, and sign on-chain approvals.",
      highlights: [
        "Deed Document Verification Desk",
        "Cadastral Blueprint Inspection",
        "EVM Title Verification Signing",
      ],
    },
    {
      role: "registrar",
      title: "Sub-Registrar Portal",
      badge: "Municipal Authority / Sub-Registrar Office",
      path: "/registrar/login",
      color: "purple",
      icon: FileCheck2,
      description: "Official government registrar certification of verified property titles and deed approvals.",
      highlights: [
        "Legal Regulatory Certification",
        "Deed Title Endorsement",
        "Government Title Ledger Oversight",
      ],
    },
    {
      role: "citizen",
      title: "Citizen & Marketplace Portal",
      badge: "Public Property Registry & Exchange",
      path: "/citizen/login",
      color: "blue",
      icon: Users,
      description: "Citizen portal for landowners to register parcels and buyers to acquire verified real estate in Rupees (INR) with smart contract settlement.",
      highlights: [
        "Self-Service Citizen Account Registration",
        "Property Deed Upload to IPFS",
        "Atomic Land Purchase in Rupees (INR) via Smart Contract",
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`border-b sticky top-0 z-30 transition-colors ${
          isDarkMode
            ? "bg-slate-900/90 border-slate-800 backdrop-blur-md"
            : "bg-white/90 border-slate-200 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                TerraChain
              </span>
              <span className={`text-xs ml-2 font-semibold px-2 py-0.5 rounded-full ${
                isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
              }`}>
                Govt. Cadastral DApp
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
              className={`p-2 rounded-lg border transition-colors tc-focus-ring ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
              title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Lock className="h-3.5 w-3.5" />
            <span>Secure Role-Based Authentication Gateway</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Authorized Land Registry Portals
          </h1>
          <p className={`text-base sm:text-lg ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Select your assigned role portal below. Privileged government accounts require verified
            credentials and cryptographic wallet authentication.
          </p>
        </div>

        {/* 4-Card Role Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.role}
                className={`flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-emerald-500/5"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-200/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold ${
                        p.color === "emerald"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : p.color === "amber"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-400"
                          : p.color === "purple"
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <StatusBadge status={p.role} size="xs" showDot={false} />
                  </div>

                  <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-3">{p.badge}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{p.description}</p>

                  <div className="space-y-2 mb-6">
                    {p.highlights.map((h, i) => (
                      <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={p.path}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs ${
                    p.color === "emerald"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : p.color === "amber"
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                      : p.color === "purple"
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  <span>Sign In as {p.role.toUpperCase()}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className={`mt-14 p-4 rounded-xl border max-w-2xl mx-auto text-center ${
          isDarkMode ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
        }`}>
          <p className="text-xs leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-200">Zero-Trust Security Boundary:</strong>{" "}
            TerraChain enforces backend bcrypt password authentication and on-chain ECDSA signature verification.
            Self-registration as a government official is strictly prohibited.
          </p>
        </div>
      </main>
    </div>
  );
}
