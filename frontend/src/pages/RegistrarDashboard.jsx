import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { landApi, getDeedDocumentUrl } from "../services/landApi";
import {
  FileCheck2,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  LogOut,
  Sun,
  Moon,
  Shield,
  MapPin,
  Stamp,
  BadgeCheck,
} from "lucide-react";

export default function RegistrarDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout } = useAuth();

  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certifyingId, setCertifyingId] = useState(null);
  const [certifiedSet, setCertifiedSet] = useState(new Set());
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

  // Certify Title on Smart Contract
  const handleCertifyTitle = async (landId) => {
    try {
      setCertifyingId(landId);
      setToast({
        type: "pending",
        title: "Submitting Registrar Certification",
        message: `Executing on-chain legal title deed certification for Parcel #${landId}...`,
      });

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
          const tx = await contract.certifyTitle(landId);
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask certification failed, using cadastral server signer:", mErr.message);
          await landApi.certifyTitle(landId);
        }
      } else {
        await landApi.certifyTitle(landId);
      }

      setCertifiedSet((prev) => new Set([...prev, landId]));
      setToast({
        type: "success",
        title: "Title Legally Certified",
        message: `Sub-Registrar legal endorsement recorded on blockchain for Parcel #${landId}.`,
      });
      loadLands();
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Certification Failed",
        message: err.response?.data?.error || err.message || "Failed to certify title.",
      });
    } finally {
      setCertifyingId(null);
    }
  };

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
                ? "bg-purple-950/90 border-purple-500/50 text-purple-200"
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
            <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  Government Sub-Registrar Portal
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
              <span className="text-xs text-slate-500 font-semibold uppercase">Verified by Inspector</span>
              <BadgeCheck className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-black">{verifiedLands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for Sub-Registrar Endorsement</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Pending Verification</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black">{lands.length - verifiedLands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting Field Inspector Approval</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Registry Parcels</span>
              <Building className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black">{lands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Official Municipal Cadastre</p>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h3 className="text-lg font-bold">Sub-Registrar Title Certification Desk</h3>
          <p className="text-xs text-slate-500">
            Review land records verified by the Land Inspectorate Division and issue on-chain legal registrar certification.
          </p>
        </div>

        {/* Verified Lands Table */}
        <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Cadastral Location</th>
                  <th className="py-3 px-4">Area (Sq Ft)</th>
                  <th className="py-3 px-4">Title Deed Document</th>
                  <th className="py-3 px-4">Inspector Status</th>
                  <th className="py-3 px-4">Registrar Endorsement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {verifiedLands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No inspector-verified land parcels ready for registrar certification yet.
                    </td>
                  </tr>
                ) : (
                  verifiedLands.map((l) => {
                    const isEndorsed = certifiedSet.has(l.id);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-purple-600 dark:text-purple-400">#{l.id}</td>
                        <td className="py-3.5 px-4 font-semibold">{l.physicalAddress}</td>
                        <td className="py-3.5 px-4">{l.areaSqFt.toLocaleString()} sq ft</td>
                        <td className="py-3.5 px-4">
                          <a
                            href={getDeedDocumentUrl(l.ipfsHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-500 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                          >
                            <span>{l.ipfsHash.slice(0, 10)}...</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                            Verified on Chain
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isEndorsed ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Legally Certified</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCertifyTitle(l.id)}
                              disabled={certifyingId === l.id}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                            >
                              {certifyingId === l.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Signing Certification...</span>
                                </>
                              ) : (
                                <>
                                  <Stamp className="h-3.5 w-3.5" />
                                  <span>Certify Title On-Chain</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
