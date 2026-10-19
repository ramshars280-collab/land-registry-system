import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { landApi, getDeedDocumentUrl } from "../services/landApi";
import { parseContractError } from "../utils/ethereum";
import { formatInr, ethToInr } from "../utils/currency";
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
  Wallet,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "../components/common/StatusBadge";
import ToastNotification from "../components/common/ToastNotification";
import ModalDialog from "../components/common/ModalDialog";

export default function RegistrarDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout, connectedAccount, connectWallet, isWalletSynced } = useAuth();

  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certifyingId, setCertifyingId] = useState(null);
  const [certifiedSet, setCertifiedSet] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [certifyModal, setCertifyModal] = useState({ isOpen: false, land: null });

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
      setCertifyModal({ isOpen: false, land: null });
      setToast({
        type: "pending",
        title: "Submitting Registrar Certification",
        message: `Executing on-chain legal title deed certification for Parcel #${landId}...`,
      });

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

        // Pre-flight check on-chain status before triggering MetaMask to avoid reverting transactions
        const landDetails = await contract.getLandDetails(landId);
        if (!landDetails.isVerified) {
          throw new Error("Parcel must be inspected and verified by a Land Inspector before title certification.");
        }

        // Pre-flight check: verify signer holds Sub-Registrar or Admin privileges on-chain
        const signerAddress = await signer.getAddress();
        const adminAddress = await contract.admin();
        const isAuthorized =
          signerAddress.toLowerCase() === adminAddress.toLowerCase() ||
          (await contract.isRegistrar(signerAddress));

        if (!isAuthorized) {
          throw new Error(
            `Connected MetaMask account (${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)}) is not an authorized Sub-Registrar on the blockchain. Please switch MetaMask to ${user?.walletAddress || "an authorized registrar account"}.`
          );
        }

        const tx = await contract.certifyTitle(landId);
        // Wait for 1 block confirmation
        await tx.wait(1);
      } else {
        // Fallback for non-Web3 browsers (uses authenticated server-side officer signer)
        await landApi.certifyTitle(landId);
      }

      setCertifiedSet((prev) => new Set([...prev, landId]));
      setToast({
        type: "success",
        title: "Title Legally Certified",
        message: `Sub-Registrar legal endorsement recorded on blockchain for Parcel #${landId}.`,
      });
      await loadLands();
    } catch (err) {
      console.error("Certification error:", err);
      const parsedMsg = parseContractError(err, new ethers.Interface(contractConfig.abi));
      setToast({
        type: "error",
        title: "Certification Failed",
        message: parsedMsg,
      });
      await loadLands();
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
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <header
        className={`border-b sticky top-0 z-40 transition-colors ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  Government Sub-Registrar Portal
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
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}
                title={
                  isWalletSynced
                    ? "MetaMask wallet matches registered Sub-Registrar account"
                    : `Active MetaMask wallet (${connectedAccount}) differs from assigned Sub-Registrar wallet (${user.walletAddress})`
                }
              >
                <div className={`h-2 w-2 rounded-full ${isWalletSynced ? "bg-purple-500" : "bg-amber-500"}`} />
                <span>{connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all tc-focus-ring"
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
                  MetaMask is active on <code className="font-mono font-bold">{connectedAccount}</code>, but this Sub-Registrar session is registered to <code className="font-mono font-bold">{user.walletAddress}</code>.
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
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="tc-table-head">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Cadastral Location</th>
                  <th className="py-3 px-4">Area (Sq Ft)</th>
                  <th className="py-3 px-4">Valuation (₹ / ETH)</th>
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
                        <td className="py-3.5 px-4 font-semibold max-w-[200px] truncate" title={l.physicalAddress}>{l.physicalAddress}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{l.areaSqFt.toLocaleString()} sq ft</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatInr(ethToInr(l.priceEth))}
                          </span>
                          <span className="text-[11px] ml-1 text-slate-500 font-medium">
                            ({l.priceEth} ETH)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status="verified on chain" />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isEndorsed ? (
                            <StatusBadge status="legally certified" showIcon={true} />
                          ) : (
                            <button
                              onClick={() => setCertifyModal({ isOpen: true, land: l })}
                              disabled={certifyingId === l.id}
                              aria-label={`Certify title on-chain for parcel #${l.id}`}
                              aria-disabled={certifyingId === l.id}
                              aria-busy={certifyingId === l.id}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50 tc-focus-ring whitespace-nowrap"
                            >
                              {certifyingId === l.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                  <span role="status">Signing Certification...</span>
                                </>
                              ) : (
                                <>
                                  <Stamp className="h-3.5 w-3.5" aria-hidden="true" />
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

      {/* PRIORITY 2: DEED MINTING / CERTIFICATION MODAL */}
      <ModalDialog
        isOpen={certifyModal.isOpen}
        onClose={() => setCertifyModal({ isOpen: false, land: null })}
        title={`Legal Title Certification — Parcel #${certifyModal.land?.id}`}
        description="Review Cadastral verification records and issue on-chain Sub-Registrar legal endorsement."
        maxWidth="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCertifyModal({ isOpen: false, land: null })}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tc-focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleCertifyTitle(certifyModal.land.id)}
              disabled={certifyingId === certifyModal.land?.id}
              aria-disabled={certifyingId === certifyModal.land?.id}
              aria-busy={certifyingId === certifyModal.land?.id}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 tc-focus-ring"
            >
              {certifyingId === certifyModal.land?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Stamp className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Confirm & Mint Legal Title On-Chain</span>
            </button>
          </>
        }
      >
        {certifyModal.land && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 space-y-1">
              <p className="font-bold text-sm">Official Sub-Registrar Endorsement</p>
              <p className="text-[11px] leading-relaxed">
                By confirming below, an immutable cryptographic seal and state-approved cadastral certification will be appended to this land parcel on the Ethereum blockchain.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex justify-between">
                <span className="text-slate-500">Parcel ID:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">#{certifyModal.land.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cadastral Location:</span>
                <span className="font-semibold text-right max-w-[220px] truncate" title={certifyModal.land.physicalAddress}>
                  {certifyModal.land.physicalAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Survey Area:</span>
                <span className="font-semibold">{certifyModal.land.areaSqFt.toLocaleString()} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valuation:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatInr(ethToInr(certifyModal.land.priceEth))} ({certifyModal.land.priceEth} ETH)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">IPFS Notary Deed:</span>
                <a
                  href={getDeedDocumentUrl(certifyModal.land.ipfsHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-500 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                >
                  <span>{certifyModal.land.ipfsHash.slice(0, 12)}...</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Owner:</span>
                <span className="font-mono text-[11px]" title={certifyModal.land.currentOwner}>
                  {certifyModal.land.currentOwner.slice(0, 8)}...{certifyModal.land.currentOwner.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
