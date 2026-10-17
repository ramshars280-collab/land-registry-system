import { ethers } from "ethers";

/**
 * Get an Ethers BrowserProvider from window.ethereum (EIP-1193)
 */
export async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask or compatible Web3 wallet not detected.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Request accounts and return the signer
 */
export async function getSigner() {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  return await provider.getSigner();
}

/**
 * Truncate address for UI display (e.g. 0x1234...abcd)
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Switch or prompt to switch network in MetaMask
 */
export async function switchNetwork(chainIdHex) {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error) {
    console.error("Network switch error:", error);
    throw error;
  }
}
