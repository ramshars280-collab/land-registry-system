import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import authApi from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectedAccount, setConnectedAccount] = useState("");
  const [authError, setAuthError] = useState("");

  // Helper to connect user wallet (optional Web3 enhancement)
  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      console.warn("MetaMask is not installed or available.");
      return "";
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        const checksum = ethers.getAddress(accounts[0]);
        setConnectedAccount(checksum);
        return checksum;
      }
    } catch (e) {
      console.warn("User dismissed or denied wallet connection:", e.message);
    }
    return "";
  }, []);

  // Check active session on initial load
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const data = await authApi.getMe();
        if (isMounted && data && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        // No session or expired - clean state
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    restoreSession();

    // Check if wallet is already connected
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      provider
        .send("eth_accounts", [])
        .then((accounts) => {
          if (accounts.length > 0 && isMounted) {
            setConnectedAccount(ethers.getAddress(accounts[0]));
          }
        })
        .catch(console.error);

      // Listen for wallet account change
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setConnectedAccount(ethers.getAddress(accounts[0]));
        } else {
          setConnectedAccount("");
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        isMounted = false;
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler: purely password and role-based
  const login = async ({ emailOrUsername, password, role }) => {
    setAuthError("");

    // Submit credentials directly to backend
    const res = await authApi.login({
      emailOrUsername,
      password,
      role,
    });

    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    } else {
      throw new Error(res.error || "Authentication failed.");
    }
  };

  // Register citizen handler
  const registerCitizen = async (formData) => {
    return await authApi.registerCitizen(formData);
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      setUser(null);
    }
  };

  // Determine if connected wallet matches user's registered wallet
  const isWalletSynced = Boolean(
    user?.walletAddress &&
      connectedAccount &&
      user.walletAddress.toLowerCase() === connectedAccount.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        connectedAccount,
        connectWallet,
        isWalletSynced,
        login,
        registerCitizen,
        logout,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
