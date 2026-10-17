import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { landApi, getDeedDocumentUrl } from "../services/landApi";
import {
  Building2,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Sun,
  Moon,
  Layers,
  MapPin,
  Clock,
} from "lucide-react";

export default function InspectorDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("desk"); // 'desk' | 'ledger'
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const loadLands = async () => {
    try {
      setLoading(true);
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
    loadLands();
  }, []);

  // Verify Land on Smart Contract
  const handleVerifyLand = async (landId) => {
    try {
      setActionLoading(landId);
      setToast({
        type: "pending",
        title: "Signing Verification",
        message: `Executing on-chain verification for Parcel #${landId}...`,
      });

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
          const tx = await contract.verifyLand(landId);
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask execution skipped, using cadastral server signer:", mErr.message);
          await landApi.verifyLand(landId);
        }
      } else {
        await landApi.verifyLand(landId);
      }

      setToast({
        type: "success",
        title: "Title Verified",
        message: `Parcel #${landId} title deed has been verified on the blockchain.`,
      });
      loadLands();
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Verification Failed",
        message: err.response?.data?.error || err.message || "Failed to verify title deed on-chain.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingLands = lands.filter((l) => !l.isVerified);
  const verifiedLands = lands.filter((l) => l.isVerified);

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
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Government Land Inspector Portal
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
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Pending Verification</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black">{pendingLands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Parcels awaiting physical deed inspection</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Verified Titles</span>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black">{verifiedLands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Certified on EVM Blockchain</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Cadastral Records</span>
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black">{lands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Master Registry Inventory</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold w-fit mb-6">
          <button
            onClick={() => setActiveTab("desk")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "desk"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Verification Desk ({pendingLands.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "ledger"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Certified Land Registry ({verifiedLands.length})
          </button>
        </div>

        {/* TAB 1: PENDING VERIFICATION DESK */}
        {activeTab === "desk" && (
          <div className="space-y-4">
            {pendingLands.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-base">All Parcels Verified</h4>
                <p className="text-xs text-slate-500 mt-1">No unverified land submissions pending audit.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pendingLands.map((land) => (
                  <div
                    key={land.id}
                    className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase">
                          Pending Audit
                        </span>
                        <h4 className="text-base font-bold mt-1 text-slate-900 dark:text-white">
                          Cadastral Parcel #{land.id}
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {land.areaSqFt.toLocaleString()} sq ft
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-5">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{land.physicalAddress}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Claimant Owner:</span>{" "}
                        <code className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                          {land.currentOwner}
                        </code>
                      </div>
                    </div>

                    {/* Deed Audit Link */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold">IPFS Notary Deed</span>
                      </div>
                      <a
                        href={getDeedDocumentUrl(land.ipfsHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-bold text-[11px]"
                      >
                        <span>Audit PDF</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleVerifyLand(land.id)}
                      disabled={actionLoading === land.id}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
                    >
                      {actionLoading === land.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Signing Verification Transaction...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Sign On-Chain Title Deed Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CERTIFIED LEDGER */}
        {activeTab === "ledger" && (
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Parcel ID</th>
                    <th className="py-3 px-4">Cadastral Location</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Title Deed (IPFS)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {verifiedLands.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-amber-500">#{l.id}</td>
                      <td className="py-3 px-4">{l.physicalAddress}</td>
                      <td className="py-3 px-4 font-semibold">{l.areaSqFt.toLocaleString()} sq ft</td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${l.ipfsHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-500 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                        >
                          <span>{l.ipfsHash.slice(0, 12)}...</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                          Verified by Inspector
                        </span>
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
    </div>
  );
}
