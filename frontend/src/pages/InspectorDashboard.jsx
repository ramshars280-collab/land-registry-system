import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { landApi, getDeedDocumentUrl } from "../services/landApi";
import { parseContractError } from "../utils/ethereum";
import { formatInr, ethToInr } from "../utils/currency";
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
  Wallet,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "../components/common/StatusBadge";
import ToastNotification from "../components/common/ToastNotification";
import ModalDialog from "../components/common/ModalDialog";

export default function InspectorDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout, connectedAccount, connectWallet, isWalletSynced } = useAuth();

  const [activeTab, setActiveTab] = useState("desk"); // 'desk' | 'ledger'
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, land: null });

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
      setVerifyModal({ isOpen: false, land: null });
      setToast({
        type: "pending",
        title: "Signing Verification",
        message: `Executing on-chain verification for Parcel #${landId}...`,
      });

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

        // Pre-flight check on-chain status before triggering MetaMask to avoid reverting transactions
        const landDetails = await contract.getLandDetails(landId);
        if (landDetails.isVerified) {
          throw new Error("This parcel has already been verified on the blockchain.");
        }

        // Pre-flight check: verify signer holds Inspector or Admin privileges on-chain
        const signerAddress = await signer.getAddress();
        const adminAddress = await contract.admin();
        const isAuthorized =
          signerAddress.toLowerCase() === adminAddress.toLowerCase() ||
          (await contract.isInspector(signerAddress));

        if (!isAuthorized) {
          throw new Error(
            `Connected MetaMask account (${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)}) is not an authorized Land Inspector on the blockchain. Please switch MetaMask to ${user?.walletAddress || "an authorized inspector account"}.`
          );
        }

        const tx = await contract.verifyLand(landId);
        // Wait for 1 block confirmation before declaring success
        await tx.wait(1);
      } else {
        // Fallback for non-Web3 browsers (uses authenticated server-side officer signer)
        await landApi.verifyLand(landId);
      }

      setToast({
        type: "success",
        title: "Title Verified",
        message: `Parcel #${landId} title deed has been verified on the blockchain.`,
      });
      await loadLands();
    } catch (err) {
      console.error("Verification error:", err);
      const parsedMsg = parseContractError(err, new ethers.Interface(contractConfig.abi));
      setToast({
        type: "error",
        title: "Verification Failed",
        message: parsedMsg,
      });
      // Refresh lands to synchronize with on-chain truth
      await loadLands();
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
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <header
        className={`border-b sticky top-0 z-40 transition-colors ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Government Land Inspector Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{user.name} • {user.department}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {connectedAccount ? (
              <div
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  isWalletSynced
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}
                title={
                  isWalletSynced
                    ? "MetaMask wallet matches registered Inspector account"
                    : `Active MetaMask wallet (${connectedAccount}) differs from assigned Inspector wallet (${user.walletAddress})`
                }
              >
                <div className={`h-2 w-2 rounded-full ${isWalletSynced ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>{connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all tc-focus-ring"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white tc-focus-ring"
              title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-all tc-focus-ring"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Wallet Mismatch Warning Banner */}
        {connectedAccount && user?.walletAddress && connectedAccount.toLowerCase() !== user.walletAddress.toLowerCase() && (
          <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold">Active MetaMask Account Mismatch</p>
                <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                  MetaMask is active on <code className="font-mono font-bold">{connectedAccount}</code>, but this Inspector session is registered to <code className="font-mono font-bold">{user.walletAddress}</code>.
                  Transactions submitted from unauthorized accounts will revert on-chain.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 self-start sm:self-center">
              Switch Account in MetaMask
            </span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Pending Verification</span>
              <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black">{pendingLands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Parcels awaiting physical deed inspection</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Verified Titles</span>
              <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black">{verifiedLands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Certified on EVM Blockchain</p>
          </div>

          <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Cadastral Records</span>
              <Layers className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black">{lands.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Master Registry Inventory</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="Inspector portal navigation"
          className="flex space-x-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold overflow-x-auto max-w-full scrollbar-none py-1 mb-6"
        >
          <button
            role="tab"
            aria-selected={activeTab === "desk"}
            onClick={() => setActiveTab("desk")}
            className={`px-4 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all tc-focus-ring ${
              activeTab === "desk"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Verification Desk ({pendingLands.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "ledger"}
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all tc-focus-ring ${
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
                    className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <StatusBadge status="pending audit" />
                          <h4 className="text-base font-bold mt-1 text-slate-900 dark:text-white">
                            Cadastral Parcel #{land.id}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {land.areaSqFt.toLocaleString()} sq ft
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-5">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="break-words">{land.physicalAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 shrink-0">Claimant Owner:</span>
                          <code className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate" title={land.currentOwner}>
                            {land.currentOwner}
                          </code>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 shrink-0">Valuation:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatInr(ethToInr(land.priceEth))} ({land.priceEth} ETH)
                          </span>
                        </div>
                      </div>

                      {/* Deed Audit Link */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
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
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setVerifyModal({ isOpen: true, land })}
                      disabled={actionLoading === land.id}
                      aria-label={`Review and sign on-chain verification for parcel #${land.id}`}
                      aria-disabled={actionLoading === land.id}
                      aria-busy={actionLoading === land.id}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50 tc-focus-ring"
                    >
                      {actionLoading === land.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span role="status">Signing Verification Transaction...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          <span>Review & Sign On-Chain Verification</span>
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
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="tc-table-head">
                  <tr>
                    <th className="py-3 px-4">Parcel ID</th>
                    <th className="py-3 px-4">Cadastral Location</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Valuation (₹ / ETH)</th>
                    <th className="py-3 px-4">Title Deed (IPFS)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {verifiedLands.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-amber-500 whitespace-nowrap">#{l.id}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate" title={l.physicalAddress}>{l.physicalAddress}</td>
                      <td className="py-3 px-4 font-semibold whitespace-nowrap">{l.areaSqFt.toLocaleString()} sq ft</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatInr(ethToInr(l.priceEth))}
                        </span>
                        <span className="text-[11px] ml-1 text-slate-500 font-medium">
                          ({l.priceEth} ETH)
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status="verified by inspector" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap" title={l.currentOwner}>
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

      {/* VERIFICATION & INSPECTION MODAL */}
      <ModalDialog
        isOpen={verifyModal.isOpen}
        onClose={() => setVerifyModal({ isOpen: false, land: null })}
        title={`Field Audit & Verification — Parcel #${verifyModal.land?.id}`}
        description="Verify physical survey coordinates and title deed authenticity before recording on EVM blockchain."
        maxWidth="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setVerifyModal({ isOpen: false, land: null })}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tc-focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleVerifyLand(verifyModal.land.id)}
              disabled={actionLoading === verifyModal.land?.id}
              aria-disabled={actionLoading === verifyModal.land?.id}
              aria-busy={actionLoading === verifyModal.land?.id}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-2 tc-focus-ring"
            >
              {actionLoading === verifyModal.land?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Sign On-Chain Verification</span>
            </button>
          </>
        }
      >
        {verifyModal.land && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold text-sm">Cadastral Division Verification Attestation</p>
              <p className="text-[11px] leading-relaxed">
                By signing, you officially certify that the property boundaries, survey area, and title deed documents have been physically inspected and verified for legal compliance.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex justify-between">
                <span className="text-slate-500">Cadastral ID:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">#{verifyModal.land.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Postal Address:</span>
                <span className="font-semibold text-right max-w-[220px] truncate" title={verifyModal.land.physicalAddress}>
                  {verifyModal.land.physicalAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Surface Area:</span>
                <span className="font-semibold">{verifyModal.land.areaSqFt.toLocaleString()} sq ft</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">IPFS Title Deed:</span>
                <a
                  href={getDeedDocumentUrl(verifyModal.land.ipfsHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-500 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                >
                  <span>{verifyModal.land.ipfsHash.slice(0, 12)}...</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Claimant Owner:</span>
                <span className="font-mono text-[11px]" title={verifyModal.land.currentOwner}>
                  {verifyModal.land.currentOwner.slice(0, 8)}...{verifyModal.land.currentOwner.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
