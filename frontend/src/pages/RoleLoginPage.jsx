import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Building2,
  FileCheck2,
  Users,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Wallet,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";

const ROLE_METADATA = {
  admin: {
    title: "Chief Administrator Portal",
    badge: "Directorate General of Land Records & Cadastral Registry",
    icon: Shield,
    color: "emerald",
    authNote: "Authorized administrator credentials required.",
  },
  inspector: {
    title: "Government Land Inspector Portal",
    badge: "Department of Land Records & Cadastral Inspection",
    icon: Building2,
    color: "amber",
    authNote: "Authorized Inspectorate Division credentials required.",
  },
  registrar: {
    title: "Sub-Registrar Portal",
    badge: "MGM Municipal Authority / Sub-Registrar Office",
    icon: FileCheck2,
    color: "purple",
    authNote: "Authorized Sub-Registrar credentials required.",
  },
  citizen: {
    title: "Citizen Real Estate Portal",
    badge: "Public Property Registry & Marketplace",
    icon: Users,
    color: "blue",
    authNote: "Secure registration and sign in for landowners, property sellers, and buyers.",
  },
};

export default function RoleLoginPage({ role, isDarkMode, toggleTheme }) {
  const navigate = useNavigate();
  const { login, registerCitizen, connectedAccount } = useAuth();

  const meta = ROLE_METADATA[role] || ROLE_METADATA.citizen;
  const Icon = meta.icon;

  // Tabs for citizen: 'signin' | 'register'
  const [activeTab, setActiveTab] = useState("signin");

  // Login form state
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration form state (citizen only)
  const [regData, setRegData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    walletAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle Login submission
  const handleSubmitLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!emailOrUsername.trim()) {
      setError("Please enter your username or email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      await login({
        emailOrUsername: emailOrUsername.trim(),
        password,
        role,
      });

      // Redirect to authorized portal dashboard
      navigate(`/${role}`);
    } catch (err) {
      console.error("Login failure:", err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        "Authentication failed. Please check your credentials.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Citizen Registration submission
  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regData.username || !regData.email || !regData.password || !regData.name || !regData.walletAddress) {
      setError("All fields are required for registration.");
      return;
    }

    try {
      setLoading(true);
      const res = await registerCitizen(regData);
      setSuccessMsg(res.message || "Registration successful! You may now sign in.");
      setEmailOrUsername(regData.email);
      setPassword("");
      setActiveTab("signin");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Bar */}
      <header
        className={`border-b h-16 flex items-center justify-between px-4 sm:px-8 transition-colors ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <Link
          to="/"
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Portals</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          {/* Card */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-colors ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Header Badge */}
            <div className="flex items-center space-x-3 mb-6">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold shadow-md ${
                  meta.color === "emerald"
                    ? "bg-emerald-500/15 text-emerald-500 shadow-emerald-500/10"
                    : meta.color === "amber"
                    ? "bg-amber-500/15 text-amber-500 shadow-amber-500/10"
                    : meta.color === "purple"
                    ? "bg-purple-500/15 text-purple-500 shadow-purple-500/10"
                    : "bg-blue-500/15 text-blue-500 shadow-blue-500/10"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{meta.title}</h2>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{meta.badge}</p>
              </div>
            </div>

            {/* Citizen Tab Switcher (SignIn / Register) */}
            {role === "citizen" && (
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signin");
                    setError("");
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    activeTab === "signin"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setError("");
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    activeTab === "register"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Register Account
                </button>
              </div>
            )}

            {/* Error & Success Banners */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {activeTab === "signin" ? (
              <form onSubmit={handleSubmitLogin} className="space-y-4">
                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Username or Official Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="e.g. officer@terrachain.gov.in"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password with Show/Hide */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secure password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md ${
                    meta.color === "emerald"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : meta.color === "amber"
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                      : meta.color === "purple"
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  } disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to {role.toUpperCase()} Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* CITIZEN REGISTRATION FORM */
              <form onSubmit={handleSubmitRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    placeholder="ramesh_landholder"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="ramesh@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (Min 8 Characters)
                  </label>
                  <input
                    type="password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Ethereum Wallet Address
                    </label>
                    {connectedAccount && (
                      <button
                        type="button"
                        onClick={() => setRegData({ ...regData, walletAddress: connectedAccount })}
                        className="text-[10px] text-blue-500 font-bold hover:underline"
                      >
                        Use Connected ({connectedAccount.slice(0, 6)}...)
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={regData.walletAddress}
                    onChange={(e) => setRegData({ ...regData, walletAddress: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md disabled:opacity-50 mt-2"
                >
                  {loading ? "Registering..." : "Complete Citizen Registration"}
                </button>
              </form>
            )}


          </div>
        </div>
      </main>
    </div>
  );
}
