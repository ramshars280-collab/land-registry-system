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

/**
 * Decode and format contract exceptions, user rejections, and provider errors
 */
export function parseContractError(err, contractInterface) {
  if (!err) return "Transaction failed.";

  // User explicitly rejected in MetaMask
  if (
    err.code === "ACTION_REJECTED" ||
    err.code === 4001 ||
    err.message?.includes("user rejected") ||
    err.message?.includes("User denied")
  ) {
    return "Transaction was cancelled in MetaMask.";
  }

  // Extract raw error data if present
  const rawData =
    err.data ||
    err.error?.data ||
    err.info?.error?.data ||
    err.payload?.error?.data ||
    err.error?.payload?.error?.data;

  if (rawData && contractInterface) {
    try {
      const parsed = contractInterface.parseError(rawData);
      if (parsed) {
        switch (parsed.name) {
          case "LandAlreadyVerified":
            return "This parcel has already been verified on the blockchain.";
          case "NotInspector":
            return "Unauthorized: Connected wallet does not hold Land Inspector privileges on the blockchain.";
          case "NotAdmin":
            return "Unauthorized: Connected wallet does not hold Chief Administrator privileges on the blockchain.";
          case "NotRegistrar":
            return "Unauthorized: Connected wallet does not hold Sub-Registrar privileges on the blockchain.";
          case "LandNotFound":
            return "Parcel ID does not exist in the cadastral registry.";
          case "LandNotVerified":
            return "This parcel must be inspected and verified by a Land Inspector first.";
          case "LandNotForSale":
            return "This parcel is not currently listed for sale on the marketplace.";
          case "CannotBuyOwnLand":
            return "You cannot purchase your own property.";
          case "InsufficientPayment":
            return "Submitted payment is less than the required asking price.";
          case "NotOwner":
            return "Unauthorized: You are not the registered owner of this property.";
          case "InvalidPrice":
            return "Listing price must be greater than 0 ETH.";
          case "InvalidArea":
            return "Parcel area must be greater than 0 sq ft.";
          case "EmptyAddress":
            return "Physical cadastral address cannot be empty.";
          case "EmptyIpfsHash":
            return "Deed document IPFS CID is required.";
          default:
            return `Smart contract reverted: ${parsed.name}`;
        }
      }
    } catch (_) {
      // Could not parse with interface
    }
  }

  // Nonce synchronization error (typical when Hardhat resets or multiple signers share account)
  if (err.message?.includes("nonce") || err.shortMessage?.includes("nonce")) {
    return "MetaMask nonce out of sync with local Hardhat node. Please reset your account in MetaMask (Settings > Advanced > Clear activity tab data).";
  }

  // Generic reason or shortMessage
  if (err.reason) return err.reason;
  if (err.shortMessage) return err.shortMessage;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;

  return "Transaction reverted on the blockchain.";
}

