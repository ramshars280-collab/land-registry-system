import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import authApi from "../services/authApi";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { landApi } from "../services/landApi";
import {
  Shield,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Key,
  Layers,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  ExternalLink,
  Loader2,
  Check,
} from "lucide-react";

export default function AdminDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout, connectedAccount, connectWallet } = useAuth();

  const [activeTab, setActiveTab] = useState("officers"); // 'officers' | 'audit' | 'registry'
  const [officers, setOfficers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Officer Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "inspector",
    department: "",
    walletAddress: "",
  });
  const [provisioning, setProvisioning] = useState(false);

  // Load Officers & Audit Logs
  const loadData = async () => {
    try {
      setLoading(true);
      const [officersRes, auditRes] = await Promise.all([
        authApi.listOfficers(),
        authApi.getAuditLogs(),
      ]);
      setOfficers(officersRes.officers || []);
      setAuditLogs(auditRes.logs || []);

      // Load on-chain lands
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);
      const total = await contract.getTotalLands();
      const items = [];
      for (let i = 1; i <= Number(total); i++) {
        const item = await contract.getLandDetails(i);
        items.push({
          id: Number(item.id),
          physicalAddress: item.physicalAddress,
          areaSqFt: Number(item.areaSqFt),
          priceInWei: item.priceInWei.toString(),
          priceEth: ethers.formatEther(item.priceInWei),
          ipfsHash: item.ipfsHash,
          currentOwner: item.currentOwner,
          isVerified: item.isVerified,
          isForSale: item.isForSale,
        });
      }
      setLands(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Provisioning
  const handleProvisionOfficer = async (e) => {
    e.preventDefault();
    try {
      setProvisioning(true);
      const res = await authApi.provisionOfficer(provisionForm);
      setToast({
        type: "success",
        title: "Officer Provisioned",
        message: `${res.officer.name} (${res.officer.role.toUpperCase()}) successfully created!`,
      });
      setIsProvisionOpen(false);
      setProvisionForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "inspector",
        department: "",
        walletAddress: "",
      });
      loadData();
    } catch (err) {
      setToast({
        type: "error",
        title: "Provisioning Failed",
        message: err.response?.data?.error || err.message,
      });
    } finally {
      setProvisioning(false);
    }
  };

  // Authorize Officer on Smart Contract
  const handleAuthorizeOnChain = async (officer) => {
    try {
      setToast({
        type: "pending",
        title: "Submitting Transaction",
        message: `Granting ${officer.role.toUpperCase()} on smart contract for ${officer.walletAddress.slice(0, 8)}...`,
      });

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

          let tx;
          if (officer.role === "inspector") {
            tx = await contract.addInspector(officer.walletAddress);
          } else {
            tx = await contract.addRegistrar(officer.walletAddress);
          }
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask authorization skipped, using cadastral server signer:", mErr.message);
          await landApi.addOfficer(officer.walletAddress, officer.role);
        }
      } else {
        await landApi.addOfficer(officer.walletAddress, officer.role);
      }

      setToast({
        type: "success",
        title: "On-Chain Role Granted",
        message: `Successfully authorized ${officer.name} on LandRegistry contract!`,
      });
      loadData();
    } catch (err) {
      setToast({
        type: "error",
        title: "Transaction Reverted",
        message: err.response?.data?.error || err.message || "Failed to grant role on-chain.",
      });
    }
  };

  // Deactivate Officer
  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate officer ${name}?`)) return;
    try {
      await authApi.deactivateOfficer(id);
      setToast({
        type: "success",
        title: "Officer Deactivated",
        message: `${name} has been removed.`,
      });
      loadData();
    } catch (err) {
      setToast({
        type: "error",
        title: "Error",
        message: err.response?.data?.error || err.message,
      });
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <div
            className={`p-4 rounded-xl border shadow-2xl flex items-start space-x-3 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toast.type === "error"
                ? "bg-red-950/90 border-red-500/50 text-red-200"
                : "bg-blue-950/90 border-blue-500/50 text-blue-200"
            }`}
          >
            <div className="text-xs">
              <p className="font-bold">{toast.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`border-b sticky top-0 z-40 transition-colors ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Chief Administrator Console
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{user.name} • {user.department}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Provisioned Officers</span>
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black">{officers.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Authorized Inspectors & Registrars</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Registered Lands</span>
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black">{lands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">EVM Smart Contract Parcels</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Security Audit Events</span>
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-black">{auditLogs.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Immutable Log Records</p>
          </div>
        </div>

        {/* Tab Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex space-x-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold w-fit">
            <button
              onClick={() => setActiveTab("officers")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "officers"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Officer Provisioning ({officers.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "audit"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Security Audit Logs ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab("registry")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "registry"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Master Cadastral Ledger ({lands.length})
            </button>
          </div>

          {activeTab === "officers" && (
            <button
              onClick={() => setIsProvisionOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Provision New Officer</span>
            </button>
          )}
        </div>

        {/* TAB 1: OFFICERS LIST */}
        {activeTab === "officers" && (
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Officer Name & Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Authorized Wallet</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {officers.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold">
                        <div>{o.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{o.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.role === "inspector"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-purple-500/15 text-purple-500"
                          }`}
                        >
                          {o.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{o.department}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {o.walletAddress.slice(0, 10)}...{o.walletAddress.slice(-6)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleAuthorizeOnChain(o)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 text-[11px] transition-all"
                          title="Sync role to smart contract on blockchain"
                        >
                          Grant on Contract
                        </button>
                        <button
                          onClick={() => handleDeactivate(o.id, o.name)}
                          className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                          title="Deactivate officer"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Target Identity</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-emerald-500">{log.action}</td>
                      <td className="py-3 px-4">{log.performedBy}</td>
                      <td className="py-3 px-4">{log.targetUser || "-"}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MASTER REGISTRY */}
        {activeTab === "registry" && (
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Parcel ID</th>
                    <th className="py-3 px-4">Cadastral Location</th>
                    <th className="py-3 px-4">Area (Sq Ft)</th>
                    <th className="py-3 px-4">Valuation (ETH)</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4">Current Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lands.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-emerald-500">#{l.id}</td>
                      <td className="py-3 px-4">{l.physicalAddress}</td>
                      <td className="py-3 px-4">{l.areaSqFt.toLocaleString()} sq ft</td>
                      <td className="py-3 px-4 font-bold">{l.priceEth} ETH</td>
                      <td className="py-3 px-4">
                        {l.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                            Verified on Chain
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                            Pending Verification
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {l.currentOwner.slice(0, 8)}...{l.currentOwner.slice(-4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* PROVISION OFFICER MODAL */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-1">Provision New Government Officer</h3>
            <p className="text-xs text-slate-500 mb-5">
              Create an authenticated officer profile and bind their government Ethereum wallet.
            </p>

            <form onSubmit={handleProvisionOfficer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={provisionForm.name}
                    onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                    placeholder="Officer Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role</label>
                  <select
                    value={provisionForm.role}
                    onChange={(e) => setProvisionForm({ ...provisionForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
                  >
                    <option value="inspector">Land Inspector</option>
                    <option value="registrar">Sub-Registrar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Official Username</label>
                  <input
                    type="text"
                    value={provisionForm.username}
                    onChange={(e) => setProvisionForm({ ...provisionForm, username: e.target.value })}
                    placeholder="officer_username"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={provisionForm.email}
                    onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                    placeholder="officer@terrachain.gov.in"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Password (Min 8 Chars)</label>
                <input
                  type="password"
                  value={provisionForm.password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Government Department / Jurisdiction</label>
                <input
                  type="text"
                  value={provisionForm.department}
                  onChange={(e) => setProvisionForm({ ...provisionForm, department: e.target.value })}
                  placeholder="e.g. Dept. of Land Records, Aurangabad Circle"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Ethereum Wallet Address</label>
                <input
                  type="text"
                  value={provisionForm.walletAddress}
                  onChange={(e) => setProvisionForm({ ...provisionForm, walletAddress: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {provisioning ? "Provisioning..." : "Provision Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
