import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { uploadFileToPinata, getIPFSGatewayUrl } from "../utils/ipfs";
import { formatAddress } from "../utils/ethereum";
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

export default function CitizenDashboard({ isDarkMode, toggleTheme }) {
  const { user, logout, connectedAccount, connectWallet } = useAuth();

  const [activeTab, setActiveTab] = useState("marketplace"); // 'marketplace' | 'properties' | 'register' | 'registry'
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    location: "",
    areaSqFt: "",
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
    currentPrice: "",
  });
  const [newListingPrice, setNewListingPrice] = useState("");

  const fileInputRef = useRef(null);

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
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

          const area = Number(regForm.areaSqFt);
          const priceWei = regForm.priceEth ? ethers.parseEther(String(regForm.priceEth)) : 0n;

          const tx = await contract.registerLand(
            regForm.location.trim(),
            area,
            priceWei,
            regForm.documentCid.trim()
          );
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask register skipped, using cadastral server signer:", mErr.message);
          await landApi.registerLand({
            physicalAddress: regForm.location.trim(),
            areaSqFt: Number(regForm.areaSqFt),
            priceEth: regForm.priceEth,
            ipfsHash: regForm.documentCid.trim(),
          });
        }
      } else {
        await landApi.registerLand({
          physicalAddress: regForm.location.trim(),
          areaSqFt: Number(regForm.areaSqFt),
          priceEth: regForm.priceEth,
          ipfsHash: regForm.documentCid.trim(),
        });
      }

      setToast({
        type: "success",
        title: "Registration Confirmed",
        message: "Your property has been submitted and is pending Land Inspector verification.",
      });

      setRegForm({ location: "", areaSqFt: "", priceEth: "", documentCid: "" });
      setSelectedFile(null);
      await loadLands();
      setActiveTab("properties");
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Registration Failed",
        message: err.response?.data?.error || err.message || "Smart contract transaction reverted.",
      });
    }
  };

  // Buy Property with ETH
  const handleBuyProperty = async (land) => {
    try {
      setToast({
        type: "pending",
        title: "Settling Escrow",
        message: `Transferring ${land.priceEth} ETH to acquire Parcel #${land.id}...`,
      });

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

          const tx = await contract.buyLand(land.id, {
            value: ethers.parseEther(land.priceEth),
          });
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask buy skipped, executing with authenticated citizen signer:", mErr.message);
          await landApi.buyLand(land.id);
        }
      } else {
        await landApi.buyLand(land.id);
      }

      setToast({
        type: "success",
        title: "Purchase Successful",
        message: `Ownership of Parcel #${land.id} successfully transferred to your wallet!`,
      });

      await loadLands();
      setActiveTab("properties");
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Purchase Failed",
        message: err.response?.data?.error || err.message || "Transaction reverted.",
      });
    }
  };

  // List Property for Sale
  const handleConfirmListing = async () => {
    if (!newListingPrice || isNaN(newListingPrice) || Number(newListingPrice) <= 0) {
      alert("Please enter a valid price in ETH.");
      return;
    }

    try {
      setToast({
        type: "pending",
        title: "Listing Property",
        message: `Listing Parcel #${listingModal.landId} on marketplace for ${newListingPrice} ETH...`,
      });

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

          const priceWei = ethers.parseEther(String(newListingPrice));
          const tx = await contract.listForSale(listingModal.landId, priceWei);
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask listing skipped, using cadastral server signer:", mErr.message);
          await landApi.listLand(listingModal.landId, newListingPrice);
        }
      } else {
        await landApi.listLand(listingModal.landId, newListingPrice);
      }

      setToast({
        type: "success",
        title: "Property Listed",
        message: `Parcel #${listingModal.landId} is now live on the public marketplace.`,
      });

      setListingModal({ isOpen: false, landId: null, currentPrice: "" });
      setNewListingPrice("");
      await loadLands();
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        title: "Listing Failed",
        message: err.response?.data?.error || err.message || "Failed to list property.",
      });
    }
  };

  // Delist Property
  const handleDelistProperty = async (landId) => {
    try {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);

          const tx = await contract.delistLand(landId);
          await tx.wait();
        } catch (mErr) {
          console.warn("MetaMask delist skipped, using cadastral server signer:", mErr.message);
          await landApi.delistLand(landId);
        }
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
      setToast({
        type: "error",
        title: "Error",
        message: err.response?.data?.error || err.message || "Failed to delist property.",
      });
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
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 dark:text-white">TerraChain</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  Citizen Property Exchange
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{user.name} • {user.department}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {connectedAccount ? (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold">
                <Wallet className="h-3.5 w-3.5 text-blue-500" />
                <span>{connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
              >
                Connect Wallet
              </button>
            )}

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
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex space-x-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold w-fit">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "marketplace"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Land Marketplace ({marketplaceLands.length})
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "properties"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              My Properties ({myProperties.length})
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              + Register New Land
            </button>
            <button
              onClick={() => setActiveTab("registry")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "registry"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Public Title Ledger ({lands.length})
            </button>
          </div>

          {activeTab === "marketplace" && (
            <div className="relative max-w-xs w-full">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parcels by location..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
              />
            </div>
          )}
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase">
                          Listed for Sale
                        </span>
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
                          <span className="font-mono text-[11px]">
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
                        <span className="text-xs text-slate-400">Price:</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {land.priceEth} ETH
                        </span>
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
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
                        >
                          <Coins className="h-4 w-4" />
                          <span>Buy Property with ETH</span>
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
                  onClick={() => setActiveTab("register")}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            land.isForSale
                              ? "bg-blue-500/15 text-blue-500"
                              : land.isVerified
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-amber-500/15 text-amber-500"
                          }`}
                        >
                          {land.isForSale
                            ? "Listed for Sale"
                            : land.isVerified
                            ? "Verified Title"
                            : "Pending Inspection"}
                        </span>
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
                          <div className="flex justify-between">
                            <span>Listing Price:</span>
                            <span className="font-bold text-emerald-500">{land.priceEth} ETH</span>
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
                          onClick={() =>
                            setListingModal({
                              isOpen: true,
                              landId: land.id,
                              currentPrice: land.priceEth,
                            })
                          }
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs"
                        >
                          List for Sale on Marketplace
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
            <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-8 shadow-md">
              <h3 className="text-xl font-bold mb-1">Register New Land Parcel</h3>
              <p className="text-xs text-slate-500 mb-6">
                Submit cadastral location and upload your title deed PDF to decentralized IPFS storage.
              </p>

              <form onSubmit={handleRegisterLand} className="space-y-5 text-xs">
                <div>
                  <label className="block font-semibold mb-1.5">Cadastral Location / Postal Survey Address</label>
                  <input
                    type="text"
                    value={regForm.location}
                    onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                    placeholder="e.g. Plot #104, Sector 12, CIDCO Urban Zone, Chh. Sambhajinagar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Surface Area (Sq Ft)</label>
                    <input
                      type="number"
                      value={regForm.areaSqFt}
                      onChange={(e) => setRegForm({ ...regForm, areaSqFt: e.target.value })}
                      placeholder="e.g. 4500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Initial Valuation / Price (ETH - Optional)</label>
                    <input
                      type="text"
                      value={regForm.priceEth}
                      onChange={(e) => setRegForm({ ...regForm, priceEth: e.target.value })}
                      placeholder="e.g. 2.5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* IPFS Deed Upload Dropzone */}
                <div>
                  <label className="block font-semibold mb-1.5">Title Deed Document / Blueprint (PDF)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-all"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      accept="application/pdf,image/*"
                      className="hidden"
                    />
                    {uploadingIpfs ? (
                      <div className="space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                        <p className="font-semibold text-xs">Uploading to Pinata IPFS ({uploadProgress}%)...</p>
                      </div>
                    ) : regForm.documentCid ? (
                      <div className="space-y-1 text-emerald-500">
                        <CheckCircle2 className="h-8 w-8 mx-auto" />
                        <p className="font-bold">Deed Pinned to IPFS</p>
                        <p className="font-mono text-[10px] text-slate-400">{regForm.documentCid}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="h-8 w-8 text-slate-400 mx-auto" />
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
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
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
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
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
                      <td className="py-3 px-4">{l.physicalAddress}</td>
                      <td className="py-3 px-4">{l.areaSqFt.toLocaleString()} sq ft</td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        {l.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                            Pending Audit
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

      {/* LISTING PRICE MODAL */}
      {listingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold mb-1">List Property for Sale</h4>
            <p className="text-xs text-slate-500 mb-4">
              Enter your asking price in ETH for Parcel #{listingModal.landId}.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">Asking Price (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={newListingPrice}
                onChange={(e) => setNewListingPrice(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setListingModal({ isOpen: false, landId: null, currentPrice: "" })}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmListing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Confirm Marketplace Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
