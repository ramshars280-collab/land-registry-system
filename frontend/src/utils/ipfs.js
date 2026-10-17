import axios from "axios";
import { uploadDocumentToStorage, getDeedDocumentUrl } from "../services/landApi";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET || "";

/**
 * Upload deed document or property image:
 * Prioritizes Pinata IPFS if API credentials are configured;
 * Falls back safely to local cadastral document adapter if offline or unconfigured.
 * @param {File} file - File object from input
 * @returns {Promise<string>} IPFS CID or Local Content Identifier
 */
export async function uploadFileToPinata(file) {
  // If Pinata credentials are present, attempt Pinata upload
  if (PINATA_JWT || (PINATA_API_KEY && PINATA_API_SECRET)) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          project: "LandBlock",
          uploadedAt: new Date().toISOString(),
        },
      });
      formData.append("pinataMetadata", metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append("pinataOptions", options);

      const headers = PINATA_JWT
        ? {
            Authorization: `Bearer ${PINATA_JWT}`,
            "Content-Type": "multipart/form-data",
          }
        : {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET,
            "Content-Type": "multipart/form-data",
          };

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        { headers, timeout: 8000 }
      );

      if (response.data?.IpfsHash) {
        return response.data.IpfsHash;
      }
    } catch (err) {
      console.warn("Pinata upload unavailable, falling back to local document adapter:", err.message);
    }
  }

  // Fallback: Local document storage adapter
  const result = await uploadDocumentToStorage(file);
  return result.cid;
}

/**
 * Pin metadata JSON to IPFS via Pinata or local fallback
 * @param {object} jsonData 
 * @returns {Promise<string>} Content CID
 */
export async function uploadJSONToPinata(jsonData) {
  if (PINATA_JWT || (PINATA_API_KEY && PINATA_API_SECRET)) {
    try {
      const headers = PINATA_JWT
        ? {
            Authorization: `Bearer ${PINATA_JWT}`,
            "Content-Type": "application/json",
          }
        : {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET,
            "Content-Type": "application/json",
          };

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataContent: jsonData,
          pinataMetadata: {
            name: `LandMetadata-${Date.now()}`,
          },
        },
        { headers, timeout: 8000 }
      );

      if (response.data?.IpfsHash) {
        return response.data.IpfsHash;
      }
    } catch (err) {
      console.warn("Pinata JSON upload failed, using fallback:", err.message);
    }
  }

  // Fallback: local blob
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
  const file = new File([blob], `metadata_${Date.now()}.json`, { type: "application/json" });
  const result = await uploadDocumentToStorage(file);
  return result.cid;
}

/**
 * Convert CID to retrievable document URL
 */
export function getIPFSGatewayUrl(cid) {
  return getDeedDocumentUrl(cid);
}
