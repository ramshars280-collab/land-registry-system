import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { uploadFileToPinata, getIPFSGatewayUrl } from "../utils/ipfs";
import { formatAddress, parseContractError } from "../utils/ethereum";
import { formatInr, ethToInr, inrToEth, ETH_TO_INR_RATE } from "../utils/currency";
import { landApi } from "../services/landApi";
import {
  Users,
  Building2,
  Coins,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  LogOut,
  Sun,
  Moon,
  Wallet,
  Tag,
  UploadCloud,
  FileText,
  MapPin,
  Layers,
  ArrowRight,
  Shield,
  Check,
} from "lucide-react";
import StatusBadge from "../components/common/StatusBadge";
import ToastNotification from "../components/common/ToastNotification";
import ModalDialog from "../components/common/ModalDialog";

export default function CitizenDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout, connectedAccount, connectWallet } = useAuth();

  const [activeTab, setActiveTab] = useState("marketplace"); // 'marketplace' | 'properties' | 'register' | 'registry'
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Registration Modal & Form State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    location: "",
    areaSqFt: "",
    priceInr: "",
    priceEth: "",
    documentCid: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingIpfs, setUploadingIpfs] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Listing Modal State
  const [listingModal, setListingModal] = useState({
    isOpen: false,
    landId: null,
    currentPriceEth: "",
    currentPriceInr: "",
  });
  const [newListingPriceInr, setNewListingPriceInr] = useState("");
  const [newListingPriceEth, setNewListingPriceEth] = useState("");

  const handlePriceInrChange = (val) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const eth = inrToEth(clean);
    setRegForm((prev) => ({
      ...prev,
      priceInr: clean,
      priceEth: clean ? String(eth) : "",
    }));
  };

  const handleListingInrChange = (val) => {
    const clean = val.replace(/[^0-9.]/g, "");
    setNewListingPriceInr(clean);
    setNewListingPriceEth(clean ? String(inrToEth(clean)) : "");
  };

  const fileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  // Load lands from smart contract
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

  // Handle IPFS File Upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingIpfs(true);
      setUploadProgress(20);
      setSelectedFile(file);

      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 15 : p));
      }, 200);

      const cid = await uploadFileToPinata(file);
      clearInterval(interval);
      setUploadProgress(100);

      setRegForm((prev) => ({ ...prev, documentCid: cid }));
      setToast({
        type: "success",
        title: "Deed Uploaded to IPFS",
        message: `Content Identifier: ${cid.slice(0, 16)}...`,
      });
    } catch (err) {
      setToast({
        type: "error",
        title: "IPFS Upload Failed",
        message: err.message || "Failed uploading title deed to Pinata IPFS.",
      });
    } finally {
      setUploadingIpfs(false);
    }
  };

  // Register Land on Chain
  const handleRegisterLand = async (e) => {
    e.preventDefault();
    if (!regForm.location || !regForm.areaSqFt || !regForm.documentCid) {
      alert("Please fill in location, area, and upload the deed document.");
      return;
    }

    try {
      setToast({
        type: "pending",
        title: "Registering Land",
        message: "Broadcasting parcel registration transaction to Ethereum network...",
      });

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

        const area = Number(regForm.areaSqFt);
        const resolvedEth = regForm.priceEth || (regForm.priceInr ? String(inrToEth(regForm.priceInr)) : "0");
        const priceWei = resolvedEth && Number(resolvedEth) > 0 ? ethers.parseEther(resolvedEth) : 0n;

        const tx = await contract.registerLand(
          regForm.location.trim(),
          area,
          priceWei,
          regForm.documentCid.trim()
        );
        await tx.wait(1);
      } else {
        const resolvedEth = regForm.priceEth || (regForm.priceInr ? String(inrToEth(regForm.priceInr)) : "0");
        await landApi.registerLand({
          physicalAddress: regForm.location.trim(),
          areaSqFt: Number(regForm.areaSqFt),
          priceEth: resolvedEth,
          ipfsHash: regForm.documentCid.trim(),
        });
      }

      setToast({
        type: "success",
        title: "Registration Confirmed",
        message: "Your property has been submitted and is pending Land Inspector verification.",
      });

      setRegForm({ location: "", areaSqFt: "", priceInr: "", priceEth: "", documentCid: "" });
      setSelectedFile(null);
      setIsRegisterModalOpen(false);
      await loadLands();
      setActiveTab("properties");
    } catch (err) {
      console.error("Register land error:", err);
      const parsedMsg = parseContractError(err, new ethers.Interface(contractConfig.abi));
      setToast({
        type: "error",
        title: "Registration Failed",
        message: parsedMsg,
      });
      await loadLands();
    }
  };

  // Buy Property with ETH (Valuation in Rupees)
  const handleBuyProperty = async (land) => {
    const inrFormatted = formatInr(ethToInr(land.priceEth));
    try {
      setToast({
        type: "pending",
        title: "Settling Escrow in Rupees",
        message: `Settling purchase of Parcel #${land.id} for ${inrFormatted} (${land.priceEth} ETH equivalent)...`,
      });

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

        // Pre-flight check on-chain listing and ownership state
        const landDetails = await contract.getLandDetails(land.id);
        if (!landDetails.isForSale) {
          throw new Error("This parcel is no longer listed for sale on the marketplace.");
        }
        if (signer.address.toLowerCase() === landDetails.currentOwner.toLowerCase()) {
          throw new Error("You already own this property.");
        }

        const tx = await contract.buyLand(land.id, {
          value: ethers.parseEther(land.priceEth),
        });
        await tx.wait(1);
      } else {
        await landApi.buyLand(land.id);
      }

      setToast({
        type: "success",
        title: "Purchase Successful",
        message: `Acquired Parcel #${land.id} for ${inrFormatted}! Title transferred to your wallet.`,
      });

      await loadLands();
      setActiveTab("properties");
    } catch (err) {
      console.error("Buy land error:", err);
      const parsedMsg = parseContractError(err, new ethers.Interface(contractConfig.abi));
      setToast({
        type: "error",
        title: "Purchase Failed",
        message: parsedMsg,
      });
      await loadLands();
    }
  };

  // List Property for Sale in Rupees (INR)
  const handleConfirmListing = async () => {
    const targetEth = newListingPriceEth || (newListingPriceInr ? String(inrToEth(newListingPriceInr)) : "");
    if (!targetEth || Number(targetEth) <= 0) {
      alert("Please enter a valid asking price in Rupees (INR).");
      return;
    }

    const inrFormatted = formatInr(newListingPriceInr || ethToInr(targetEth));

    try {
      setToast({
        type: "pending",
        title: "Listing Property in Rupees",
        message: `Listing Parcel #${listingModal.landId} on marketplace for ${inrFormatted} (${targetEth} ETH)...`,
      });

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

        // Pre-flight check
        const landDetails = await contract.getLandDetails(listingModal.landId);
        if (!landDetails.isVerified) {
          throw new Error("Parcel must be verified by an Inspector before listing on the marketplace.");
        }

        const priceWei = ethers.parseEther(String(targetEth));
        const tx = await contract.listForSale(listingModal.landId, priceWei);
        await tx.wait(1);
      } else {
        await landApi.listLand(listingModal.landId, targetEth);
      }

      setToast({
        type: "success",
        title: "Property Listed",
        message: `Parcel #${listingModal.landId} is now live on marketplace for ${inrFormatted}!`,
      });

      setListingModal({ isOpen: false, landId: null, currentPriceEth: "", currentPriceInr: "" });
      setNewListingPriceInr("");
      setNewListingPriceEth("");
      await loadLands();
    } catch (err) {
      console.error("List land error:", err);
      const parsedMsg = parseContractError(err, new ethers.Interface(contractConfig.abi));
      setToast({
        type: "error",
        title: "Listing Failed",
        message: parsedMsg,
      });
      await loadLands();
    }
  };

  // Delist Property
  const handleDelistProperty = async (landId) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

        const tx = await contract.delistLand(landId);
        await tx.wait(1);
      } else {
        await landApi.delistLand(landId);
      }

      setToast({
        type: "success",
        title: "Property Delisted",
        message: `Parcel #${landId} has been removed from marketplace.`,
      });
      await loadLands();
    } catch (err) {
      console.error("Delist error:", err);
      const parsedMsg = parseContractError(err, new ethers.Interface(contractConfig.abi));
      setToast({
        type: "error",
        title: "Delist Failed",
        message: parsedMsg,
      });
      await loadLands();
    }
  };

  // Filters
  const userAddress = (connectedAccount || user.walletAddress).toLowerCase();
  const myProperties = lands.filter((l) => l.currentOwner.toLowerCase() === userAddress);
  const marketplaceLands = lands.filter((l) => l.isForSale && l.isVerified);
  const filteredMarketplace = marketplaceLands.filter((l) =>
    l.physicalAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  Citizen Property Exchange
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{user.name} • {user.department}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {connectedAccount ? (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold">
                <Wallet className="h-3.5 w-3.5 text-blue-500" />
                <span>{connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs"
              >
                Connect Wallet
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
        {/* Navigation Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div
            role="tablist"
            aria-label="Citizen portal navigation"
            className="flex space-x-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold overflow-x-auto max-w-full scrollbar-none py-1"
          >
            <button
              role="tab"
              aria-selected={activeTab === "marketplace"}
              onClick={() => setActiveTab("marketplace")}
              className={`px-4 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all tc-focus-ring ${
                activeTab === "marketplace"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Land Marketplace ({marketplaceLands.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "properties"}
              onClick={() => setActiveTab("properties")}
              className={`px-4 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all tc-focus-ring ${
                activeTab === "properties"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              My Properties ({myProperties.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "register" || isRegisterModalOpen}
              onClick={() => {
                setActiveTab("register");
                setIsRegisterModalOpen(true);
              }}
              className={`px-4 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all flex items-center space-x-1.5 tc-focus-ring ${
                activeTab === "register" || isRegisterModalOpen
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Register New Land</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "registry"}
              onClick={() => setActiveTab("registry")}
              className={`px-4 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all tc-focus-ring ${
                activeTab === "registry"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Public Title Ledger ({lands.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs shrink-0 tc-focus-ring"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Register Land</span>
            </button>

            {activeTab === "marketplace" && (
              <div className="relative max-w-xs w-full">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" aria-hidden="true" />
                <input
                  id="marketplace-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parcels by location..."
                  aria-label="Search parcels by location"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none tc-focus-ring"
                />
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: MARKETPLACE */}
        {activeTab === "marketplace" && (
          <div>
            {filteredMarketplace.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-base">No Properties Listed for Sale</h4>
                <p className="text-xs text-slate-500 mt-1">Check back later or register and list your own parcel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredMarketplace.map((land) => (
                  <div
                    key={land.id}
                    className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <StatusBadge status="listed for sale" />
                        <span className="text-xs font-bold text-slate-400">#{land.id}</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                        {land.physicalAddress}
                      </h4>

                      <div className="space-y-1.5 text-xs text-slate-500 mb-5">
                        <div className="flex justify-between">
                          <span>Total Area:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {land.areaSqFt.toLocaleString()} sq ft
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Owner:</span>
                          <span className="font-mono text-[11px]" title={land.currentOwner}>
                            {land.currentOwner.slice(0, 8)}...{land.currentOwner.slice(-4)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="font-semibold">Verified Title</span>
                        </div>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${land.ipfsHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline flex items-center space-x-1 font-bold text-[11px]"
                        >
                          <span>Deed PDF</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Price in Rupees
                          </span>
                          <div className="flex items-baseline space-x-2 mt-0.5">
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                              {formatInr(ethToInr(land.priceEth))}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              {land.priceEth} ETH
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Fixed INR Price • Smart Contract Escrow</span>
                        </div>
                      </div>

                      {land.currentOwner.toLowerCase() === userAddress ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-xs"
                        >
                          You Own This Parcel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyProperty(land)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all tc-focus-ring"
                        >
                          <Coins className="h-4 w-4" />
                          <span>Buy Property for {formatInr(ethToInr(land.priceEth))}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY PROPERTIES */}
        {activeTab === "properties" && (
          <div>
            {myProperties.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-base">No Registered Properties Found</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  You currently have no land titles assigned to your wallet address.
                </p>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Register Your First Land Parcel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map((land) => (
                  <div
                    key={land.id}
                    className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <StatusBadge
                          status={
                            land.isForSale
                              ? "listed for sale"
                              : land.isVerified
                              ? "verified title"
                              : "pending inspection"
                          }
                        />
                        <span className="text-xs font-bold text-slate-400">#{land.id}</span>
                      </div>

                      <h4 className="text-base font-bold mb-2">{land.physicalAddress}</h4>

                      <div className="text-xs space-y-1.5 text-slate-500 mb-4">
                        <div className="flex justify-between">
                          <span>Surface Area:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {land.areaSqFt.toLocaleString()} sq ft
                          </span>
                        </div>
                        {land.isForSale && (
                          <div className="flex justify-between items-baseline">
                            <span>Listing Price:</span>
                            <div className="text-right">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatInr(ethToInr(land.priceEth))}
                              </span>
                              <span className="text-[11px] ml-1.5 font-semibold text-slate-500">
                                ({land.priceEth} ETH)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {!land.isVerified ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium text-center">
                          Awaiting Land Inspector verification before eligible for sale.
                        </div>
                      ) : land.isForSale ? (
                        <button
                          onClick={() => handleDelistProperty(land.id)}
                          className="w-full py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold text-xs transition-all"
                        >
                          Delist from Marketplace
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setListingModal({
                              isOpen: true,
                              landId: land.id,
                              currentPriceEth: land.priceEth,
                              currentPriceInr: String(ethToInr(land.priceEth) || ""),
                            });
                            setNewListingPriceInr(String(ethToInr(land.priceEth) || ""));
                            setNewListingPriceEth(String(land.priceEth || ""));
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs"
                        >
                          List for Sale on Marketplace (₹)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER NEW PROPERTY */}
        {activeTab === "register" && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-xl font-bold">Register New Land Parcel</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submit cadastral location and upload your title deed PDF to decentralized IPFS storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 self-start sm:self-center flex items-center space-x-1 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Open in Modal</span>
                </button>
              </div>

              <form onSubmit={handleRegisterLand} className="space-y-5 text-xs">
                <div>
                  <label htmlFor="citizen-inpage-reg-location" className="block font-semibold mb-1.5">
                    Cadastral Location / Postal Survey Address
                  </label>
                  <input
                    id="citizen-inpage-reg-location"
                    type="text"
                    value={regForm.location}
                    onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                    placeholder="e.g. Plot #104, Sector 12, CIDCO Urban Zone, Chh. Sambhajinagar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 tc-focus-ring"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="citizen-inpage-reg-area" className="block font-semibold mb-1.5">
                      Surface Area (Sq Ft)
                    </label>
                    <input
                      id="citizen-inpage-reg-area"
                      type="number"
                      value={regForm.areaSqFt}
                      onChange={(e) => setRegForm({ ...regForm, areaSqFt: e.target.value })}
                      placeholder="e.g. 4500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 tc-focus-ring"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="citizen-inpage-reg-price" className="block font-semibold">
                        Valuation / Asking Price in Rupees (₹)
                      </label>
                      <span className="text-[10px] text-slate-400">1 ETH = ₹2,50,000</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                      <input
                        id="citizen-inpage-reg-price"
                        type="number"
                        value={regForm.priceInr}
                        onChange={(e) => handlePriceInrChange(e.target.value)}
                        placeholder="e.g. 2500000 (₹25 Lakh)"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 tc-focus-ring font-semibold"
                      />
                    </div>
                    {regForm.priceInr && Number(regForm.priceInr) > 0 && (
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Equivalent on-chain: {inrToEth(regForm.priceInr)} ETH ({formatInr(regForm.priceInr, true)})
                      </p>
                    )}
                  </div>
                </div>

                {/* IPFS Deed Upload Dropzone */}
                <div>
                  <label htmlFor="citizen-inpage-reg-file" className="block font-semibold mb-1.5">
                    Title Deed Document / Blueprint (PDF)
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload Title Deed Document (PDF or image)"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-all tc-focus-ring"
                  >
                    <input
                      id="citizen-inpage-reg-file"
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      accept="application/pdf,image/*"
                      className="hidden"
                    />
                    {uploadingIpfs ? (
                      <div className="space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" aria-hidden="true" />
                        <p className="font-semibold text-xs" role="status">Uploading to Pinata IPFS ({uploadProgress}%)...</p>
                      </div>
                    ) : regForm.documentCid ? (
                      <div className="space-y-1 text-emerald-500">
                        <CheckCircle2 className="h-8 w-8 mx-auto" aria-hidden="true" />
                        <p className="font-bold">Deed Pinned to IPFS</p>
                        <p className="font-mono text-[10px] text-slate-400 break-all">{regForm.documentCid}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          Click to select Title Deed PDF or drag here
                        </p>
                        <p className="text-[11px] text-slate-400">PDF, PNG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingIpfs || !regForm.documentCid}
                  aria-disabled={uploadingIpfs || !regForm.documentCid}
                  aria-busy={uploadingIpfs}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 tc-focus-ring"
                >
                  Submit Land Registration to EVM
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: PUBLIC TITLE LEDGER */}
        {activeTab === "registry" && (
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="tc-table-head">
                  <tr>
                    <th className="py-3 px-4">Parcel ID</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Deed Hash (IPFS)</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lands.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-blue-500">#{l.id}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate" title={l.physicalAddress}>{l.physicalAddress}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{l.areaSqFt.toLocaleString()} sq ft</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${l.ipfsHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-500 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                        >
                          <span>{l.ipfsHash.slice(0, 10)}...</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={l.isVerified ? "verified" : "pending audit"} />
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

      {/* PRIORITY 1: PROPERTY REGISTRATION MODAL */}
      <ModalDialog
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Land Parcel"
        description="Submit cadastral location and upload your title deed PDF to decentralized IPFS storage."
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tc-focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="citizen-register-modal-form"
              disabled={uploadingIpfs || !regForm.documentCid}
              aria-disabled={uploadingIpfs || !regForm.documentCid}
              aria-busy={uploadingIpfs}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center space-x-2 tc-focus-ring"
            >
              {uploadingIpfs ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              <span>Submit Land Registration to EVM</span>
            </button>
          </>
        }
      >
        <form
          id="citizen-register-modal-form"
          onSubmit={handleRegisterLand}
          className="space-y-4 text-xs"
        >
          <div>
            <label htmlFor="modal-reg-location" className="block font-semibold mb-1.5">
              Cadastral Location / Postal Survey Address
            </label>
            <input
              id="modal-reg-location"
              type="text"
              value={regForm.location}
              onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
              placeholder="e.g. Plot #104, Sector 12, CIDCO Urban Zone, Chh. Sambhajinagar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 tc-focus-ring"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-reg-area" className="block font-semibold mb-1.5">
                Surface Area (Sq Ft)
              </label>
              <input
                id="modal-reg-area"
                type="number"
                value={regForm.areaSqFt}
                onChange={(e) => setRegForm({ ...regForm, areaSqFt: e.target.value })}
                placeholder="e.g. 4500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 tc-focus-ring"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="modal-reg-price" className="block font-semibold">
                  Valuation / Asking Price in Rupees (₹)
                </label>
                <span className="text-[10px] text-slate-400">1 ETH = ₹2,50,000</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  id="modal-reg-price"
                  type="number"
                  value={regForm.priceInr}
                  onChange={(e) => handlePriceInrChange(e.target.value)}
                  placeholder="e.g. 2500000 (₹25 Lakh)"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 tc-focus-ring font-semibold"
                />
              </div>
              {regForm.priceInr && Number(regForm.priceInr) > 0 && (
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Equivalent on-chain: {inrToEth(regForm.priceInr)} ETH ({formatInr(regForm.priceInr, true)})
                </p>
              )}
            </div>
          </div>

          {/* IPFS Deed Upload Dropzone */}
          <div>
            <label htmlFor="modal-reg-deed-file" className="block font-semibold mb-1.5">
              Title Deed Document / Blueprint (PDF)
            </label>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload Title Deed Document (PDF or image)"
              onClick={() => modalFileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  modalFileInputRef.current?.click();
                }
              }}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-all tc-focus-ring"
            >
              <input
                id="modal-reg-deed-file"
                type="file"
                ref={modalFileInputRef}
                onChange={(e) => handleFileUpload(e.target.files[0])}
                accept="application/pdf,image/*"
                className="hidden"
              />
              {uploadingIpfs ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" aria-hidden="true" />
                  <p className="font-semibold text-xs" role="status">Uploading to Pinata IPFS ({uploadProgress}%)...</p>
                </div>
              ) : regForm.documentCid ? (
                <div className="space-y-1 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto" aria-hidden="true" />
                  <p className="font-bold">Deed Pinned to IPFS</p>
                  <p className="font-mono text-[10px] text-slate-400 break-all">{regForm.documentCid}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Click to select Title Deed PDF or drag here
                  </p>
                  <p className="text-[11px] text-slate-400">PDF, PNG up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </ModalDialog>

      {/* PRIORITY 2: LISTING PRICE MODAL */}
      <ModalDialog
        isOpen={listingModal.isOpen}
        onClose={() => setListingModal({ isOpen: false, landId: null, currentPrice: "" })}
        title="List Property for Sale in Rupees (₹)"
        description={`Set your legally binding asking price in Indian Rupees for Parcel #${listingModal.landId}.`}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setListingModal({ isOpen: false, landId: null, currentPriceEth: "", currentPriceInr: "" })}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tc-focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmListing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all tc-focus-ring"
            >
              Confirm Listing in Rupees
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal-listing-price" className="block font-semibold">
                Asking Price in Rupees (₹)
              </label>
              <span className="text-[10px] text-slate-400">1 ETH = ₹2,50,000</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
              <input
                id="modal-listing-price"
                type="number"
                value={newListingPriceInr}
                onChange={(e) => handleListingInrChange(e.target.value)}
                placeholder="e.g. 1500000"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 tc-focus-ring"
                autoFocus
              />
            </div>
            {newListingPriceInr && Number(newListingPriceInr) > 0 && (
              <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Listed on-chain as: {inrToEth(newListingPriceInr)} ETH ({formatInr(newListingPriceInr, true)})
              </p>
            )}
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
