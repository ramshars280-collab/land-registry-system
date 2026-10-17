import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import contractConfig from "../contracts/LandRegistryConfig.json";
import { getIPFSGatewayUrl } from "../services/pinataService";

const Web3Context = createContext(null);

// Fallback RPC URL for local Hardhat node if MetaMask is not yet connected
const LOCAL_RPC_URL = "http://127.0.0.1:8545";

export function Web3Provider({ children }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0.0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [contractAdmin, setContractAdmin] = useState("");

  const contractAddress = contractConfig.address;
  const contractAbi = contractConfig.abi;

  /**
   * 1. Read-Only Provider & Contract instance
   * Uses window.ethereum if available, otherwise falls back to local JSON-RPC
   */
  const readOnlyProvider = useMemo(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return new ethers.JsonRpcProvider(LOCAL_RPC_URL);
  }, []);

  const readOnlyContract = useMemo(() => {
    return new ethers.Contract(contractAddress, contractAbi, readOnlyProvider);
  }, [contractAddress, contractAbi, readOnlyProvider]);

  /**
   * Helper to retrieve signer and writable contract instance
   */
  const getSignerContract = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No Web3 wallet detected. Please install MetaMask.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractAbi, signer);
  }, [contractAddress, contractAbi]);

  /**
   * Fetch Contract Admin Address & compare with connected account
   */
  const checkAdminStatus = useCallback(
    async (userAccount) => {
      try {
        const adminAddress = await readOnlyContract.admin();
        setContractAdmin(adminAddress);
        if (userAccount) {
          setIsAdmin(userAccount.toLowerCase() === adminAddress.toLowerCase());
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.warn("Could not check contract admin status:", err.message);
      }
    },
    [readOnlyContract]
  );

  /**
   * Refresh balance of currently connected account
   */
  const refreshBalance = useCallback(
    async (userAddress) => {
      if (!userAddress || !window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const rawBalance = await provider.getBalance(userAddress);
        setBalance(parseFloat(ethers.formatEther(rawBalance)).toFixed(4));
      } catch (err) {
        console.warn("Failed to update balance:", err.message);
      }
    },
    []
  );

  /**
   * Connect MetaMask Wallet
   */
  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      const msg = "MetaMask not detected! Please install MetaMask to interact with LandBlock.";
      setError(msg);
      throw new Error(msg);
    }

    try {
      setIsConnecting(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      // Prompt MetaMask connection
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        const userAccount = accounts[0];
        setAccount(userAccount);
        setChainId(Number(network.chainId));

        await refreshBalance(userAccount);
        await checkAdminStatus(userAccount);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet.");
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [checkAdminStatus, refreshBalance]);

  /**
   * Disconnect local state
   */
  const disconnectWallet = useCallback(() => {
    setAccount("");
    setBalance("0.0");
    setIsAdmin(false);
  }, []);

  /**
   * Listen to MetaMask account & chain changes
   */
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await refreshBalance(accounts[0]);
        await checkAdminStatus(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial check if wallet is already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          handleAccountsChanged(accounts);
        } else {
          checkAdminStatus("");
        }
      })
      .catch((err) => console.warn("Auto-connect check skipped:", err.message));

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkAdminStatus, disconnectWallet, refreshBalance]);

  // ========================================================
  // CONTRACT WRAPPER FUNCTIONS
  // ========================================================

  /**
   * Register a new property on-chain
   */
  const registerProperty = useCallback(
    async (addressText, area, priceEth, ipfsHash) => {
      if (!account) throw new Error("Wallet not connected. Connect your wallet first.");
      if (!addressText?.trim()) throw new Error("Physical address cannot be empty.");
      if (!area || Number(area) <= 0) throw new Error("Area must be greater than 0 sq ft.");
      if (!ipfsHash?.trim()) throw new Error("Deed IPFS hash is required.");

      const contract = await getSignerContract();
      const priceWei = priceEth && Number(priceEth) > 0 ? ethers.parseEther(String(priceEth)) : 0n;

      const tx = await contract.registerLand(
        addressText.trim(),
        Number(area),
        priceWei,
        ipfsHash.trim()
      );

      const receipt = await tx.wait();
      await refreshBalance(account);
      return receipt;
    },
    [account, getSignerContract, refreshBalance]
  );

  /**
   * Verify land title (Admin / Inspector only)
   */
  const verifyProperty = useCallback(
    async (landId) => {
      if (!account) throw new Error("Wallet not connected.");
      if (!isAdmin) throw new Error("Unauthorized: Only the contract admin can verify properties.");

      const contract = await getSignerContract();
      const tx = await contract.verifyLand(landId);
      const receipt = await tx.wait();
      return receipt;
    },
    [account, isAdmin, getSignerContract]
  );

  /**
   * List verified land for sale
   */
  const listProperty = useCallback(
    async (landId, priceEth) => {
      if (!account) throw new Error("Wallet not connected.");
      if (!priceEth || Number(priceEth) <= 0) throw new Error("Listing price must be greater than 0 ETH.");

      const contract = await getSignerContract();
      const priceWei = ethers.parseEther(String(priceEth));
      const tx = await contract.listForSale(landId, priceWei);
      const receipt = await tx.wait();
      return receipt;
    },
    [account, getSignerContract]
  );

  /**
   * Delist verified land from sale
   */
  const delistProperty = useCallback(
    async (landId) => {
      if (!account) throw new Error("Wallet not connected.");

      const contract = await getSignerContract();
      const tx = await contract.delistLand(landId);
      const receipt = await tx.wait();
      return receipt;
    },
    [account, getSignerContract]
  );

  /**
   * Purchase land listed for sale
   */
  const purchaseProperty = useCallback(
    async (landId, priceEth) => {
      if (!account) throw new Error("Wallet not connected.");
      if (!priceEth) throw new Error("Price is required for purchase.");

      const contract = await getSignerContract();
      const priceWei = ethers.parseEther(String(priceEth));

      const tx = await contract.buyLand(landId, { value: priceWei });
      const receipt = await tx.wait();
      await refreshBalance(account);
      return receipt;
    },
    [account, getSignerContract, refreshBalance]
  );

  /**
   * Query all registered properties, format bigints & format gateway URLs
   */
  const fetchAllLands = useCallback(async () => {
    try {
      const totalCount = await readOnlyContract.getTotalLands();
      const landsList = [];

      for (let i = 1; i <= Number(totalCount); i++) {
        const item = await readOnlyContract.getLandDetails(i);

        landsList.push({
          id: Number(item.id),
          physicalAddress: item.physicalAddress,
          areaSqFt: Number(item.areaSqFt),
          priceInWei: item.priceInWei.toString(),
          priceEth: ethers.formatEther(item.priceInWei),
          ipfsHash: item.ipfsHash,
          gatewayUrl: getIPFSGatewayUrl(item.ipfsHash),
          currentOwner: item.currentOwner,
          isVerified: item.isVerified,
          isForSale: item.isForSale,
        });
      }

      return landsList;
    } catch (err) {
      console.error("Error fetching lands from blockchain:", err);
      throw err;
    }
  }, [readOnlyContract]);

  const value = {
    // State
    account,
    chainId,
    balance,
    isAdmin,
    isConnecting,
    error,
    contractAddress,
    contractAdmin,

    // Core Connection
    connectWallet,
    disconnectWallet,
    refreshBalance,

    // Contract Instances
    readOnlyContract,
    getSignerContract,

    // Contract Wrappers
    registerProperty,
    verifyProperty,
    listProperty,
    delistProperty,
    purchaseProperty,
    fetchAllLands,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

/**
 * Custom Hook: useLandRegistry
 */
export function useLandRegistry() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useLandRegistry must be used within a Web3Provider");
  }
  return context;
}
