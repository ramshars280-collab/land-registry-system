import React, { useState } from "react";
import {
  Shield,
  Building2,
  Coins,
  Lock,
  Mail,
  Key,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Layers,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Copy,
  Sun,
  Moon,
} from "lucide-react";

export const PORTAL_USERS = {
  inspector: {
    id: "user-inspector",
    role: "inspector",
    portalName: "Government Land Inspector Portal",
    badgeTitle: "MGM Municipal Authority / Land Registrar",
    name: "Officer Rajesh Patil",
    email: "inspector@terrachain.gov.in",
    password: "inspector123",
    department: "Department of Land Revenue & Registry, Govt. of Maharashtra",
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    color: "amber",
    icon: Shield,
    privileges: [
      "Access to Government Land Inspector Verification Desk",
      "Inspect notary deed PDFs and surveyor blueprints hosted on IPFS",
      "Sign and execute cryptographic title approval transactions on EVM",
      "Immutable ledger audit trail oversight (All Registered Lands)",
      "Strictly prohibited from personal property trading",
    ],
  },
  seller: {
    id: "user-seller",
    role: "seller",
    portalName: "Land Owner & Seller Portal",
    badgeTitle: "Verified Citizen Real Estate Owner",
    name: "Ananya Sharma",
    email: "seller@terrachain.io",
    password: "seller123",
    department: "Registered Citizen Property Owner (CIDCO Zone)",
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    color: "emerald",
    icon: Building2,
    privileges: [
      "Upload physical title deeds and boundary surveys to Pinata IPFS",
      "Register new land parcels on the decentralized EVM ledger",
      "Manage personal property portfolio and track verification status",
      "List verified lands for sale and adjust pricing in ETH",
      "Direct atomic cryptocurrency settlement into owner wallet",
    ],
  },
  buyer: {
    id: "user-buyer",
    role: "buyer",
    portalName: "Property Buyer & Investor Portal",
    badgeTitle: "Certified Real Estate Investor",
    name: "Vikram Malhotra",
    email: "buyer@terrachain.io",
    password: "buyer123",
    department: "Apex Real Estate Holdings & Retail Investor",
    walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    color: "blue",
    icon: Coins,
    privileges: [
      "Explore public Land Marketplace with search and filters",
      "Verify deed documents on IPFS before initiating purchase",
      "Execute instant atomic smart contract purchase in ETH",
      "Instant on-chain title deed transfer via ReentrancyGuard escrow",
      "Track acquired property titles in personal portfolio",
    ],
  },
};

export default function LoginPage({ onLoginSuccess, isDarkMode = false, toggleTheme }) {
  const [selectedPortal, setSelectedPortal] = useState("inspector");
  const [email, setEmail] = useState("inspector@terrachain.gov.in");
  const [password, setPassword] = useState("inspector123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const activeConfig = PORTAL_USERS[selectedPortal];
  const IconComponent = activeConfig.icon;

  const handlePortalSwitch = (portalKey) => {
    setSelectedPortal(portalKey);
    const targetUser = PORTAL_USERS[portalKey];
    setEmail(targetUser.email);
    setPassword(targetUser.password);
    setError("");
  };

  const handleAutoFill = () => {
    setEmail(activeConfig.email);
    setPassword(activeConfig.password);
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (
      email.toLowerCase() === activeConfig.email.toLowerCase() &&
      password === activeConfig.password
    ) {
      onLoginSuccess(activeConfig);
    } else {
      setError(
        `Invalid credentials for ${activeConfig.portalName}. You can click "Auto-Fill Demo Credentials" below.`
      );
    }
  };

  const handleCopyKey = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(activeConfig.privateKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
        isDarkMode
          ? "bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950"
          : "bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950"
      }`}
    >
      {/* Top Protocol Header */}
      <header
        className={`border-b px-4 sm:px-8 py-3 flex items-center justify-between transition-colors ${
          isDarkMode
            ? "border-slate-800/80 bg-slate-900/60 backdrop-blur-md"
            : "border-slate-200 bg-white/95 backdrop-blur-md shadow-xs"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-base font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                TerraChain
              </span>
              <span className={isDarkMode ? "text-slate-500" : "text-slate-300"}>/</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                Multi-Portal Authentication Gateway
              </span>
            </div>
            <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              MGM University B.Tech Mini Project • Decentralized Real Estate Protocol
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`hidden md:flex items-center space-x-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>EVM Node: Localhost 8545</span>
          </div>

          {/* Theme Toggle Button */}
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        {/* Title & Overview */}
        <div className="text-center max-w-2xl mb-8 space-y-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
              isDarkMode
                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                : "text-amber-800 bg-amber-50 border-amber-300"
            }`}
          >
            Role-Based Access Control (RBAC)
          </span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Select Your Role Portal to Sign In
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Each role in TerraChain has distinct cryptographic privileges, isolated views, and designated on-chain authority.
          </p>
        </div>

        {/* 3 Portal Selection Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mb-6">
          {Object.entries(PORTAL_USERS).map(([key, user]) => {
            const Icon = user.icon;
            const isSelected = selectedPortal === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePortalSwitch(key)}
                className={`p-4 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? isDarkMode
                      ? key === "inspector"
                        ? "bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30"
                        : key === "seller"
                        ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                        : "bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                      : key === "inspector"
                      ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20 text-slate-900"
                      : key === "seller"
                      ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20 text-slate-900"
                      : "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20 text-slate-900"
                    : isDarkMode
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                        key === "inspector"
                          ? isDarkMode
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-amber-100 text-amber-700 border border-amber-300"
                          : key === "seller"
                          ? isDarkMode
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : isDarkMode
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isDarkMode
                            ? "bg-slate-800 text-white border-slate-700"
                            : "bg-emerald-50 text-emerald-800 border-emerald-300"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 text-emerald-500" /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {user.portalName}
                  </h3>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {user.department}
                  </p>
                </div>

                <div
                  className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                    isDarkMode ? "border-slate-800/80 text-slate-400" : "border-slate-100 text-slate-500"
                  }`}
                >
                  <span className="font-mono">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Login &rarr;
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Portal Login Box & Privileges */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 w-full rounded-2xl p-6 sm:p-8 shadow-xl border transition-colors ${
            isDarkMode
              ? "bg-slate-900/90 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Left: Login Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`flex items-center space-x-3 pb-4 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedPortal === "inspector"
                    ? isDarkMode
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-amber-100 text-amber-700 border border-amber-300"
                    : selectedPortal === "seller"
                    ? isDarkMode
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : isDarkMode
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-blue-100 text-blue-700 border border-blue-300"
                }`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Sign In to {activeConfig.portalName}
                </h2>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {activeConfig.badgeTitle}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-600 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className={`h-4 w-4 absolute left-3 top-3 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className={`w-full rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-hidden transition-colors border ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`h-4 w-4 absolute left-3 top-3 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full rounded-lg pl-9 pr-10 py-2.5 text-xs focus:outline-hidden transition-colors border ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-3 ${isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Auto Fill Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className={`text-xs font-medium flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30"
                      : "text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Auto-Fill Demo Credentials</span>
                </button>

                <span className={`text-[11px] font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Default: {activeConfig.password}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full font-bold py-2.5 rounded-lg text-xs transition-all shadow-md flex items-center justify-center space-x-2 mt-4 active:scale-98 ${
                  selectedPortal === "inspector"
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : selectedPortal === "seller"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                <span>Authenticate & Access {activeConfig.portalName}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Right: Assigned Privileges & Blockchain Identity */}
          <div
            className={`lg:col-span-5 rounded-xl p-5 flex flex-col justify-between space-y-4 border ${
              isDarkMode
                ? "bg-slate-950/80 border-slate-800"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className={`flex items-center justify-between mb-3 pb-2 border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  Enforced Role Privileges
                </h4>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  RBAC Active
                </span>
              </div>

              <ul className={`space-y-2 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                {activeConfig.privileges.map((priv, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{priv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mapped Blockchain Identity */}
            <div className={`pt-3 border-t space-y-2 text-xs ${isDarkMode ? "border-slate-800/80" : "border-slate-200"}`}>
              <span className={`text-[11px] font-semibold block ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Mapped Ethereum Testnet Address
              </span>
              <div
                className={`border rounded-lg p-2.5 font-mono text-[11px] break-all flex items-center justify-between ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 text-slate-300"
                    : "bg-white border-slate-200 text-slate-700 shadow-2xs"
                }`}
              >
                <span>{activeConfig.walletAddress}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  Private key for MetaMask:
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1"
                >
                  {copiedKey ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Private Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`border-t px-4 py-3 text-center text-[11px] transition-colors ${
          isDarkMode
            ? "border-slate-800/80 bg-slate-900/40 text-slate-500"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        TerraChain Protocol • Official Cadastral Registry Edition • Directorate General of Land Records
      </footer>
    </div>
  );
}
