import axios from "axios";

// Environment credentials (Vite exposes variables prefixed with VITE_)
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_SECRET_KEY =
  import.meta.env.VITE_PINATA_SECRET_KEY ||
  import.meta.env.VITE_PINATA_API_SECRET ||
  "";
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

/**
 * Builds authorization headers depending on whether JWT or API Key pair is provided.
 */
function getPinataHeaders(isFormData = true) {
  const headers = {};

  if (isFormData) {
    // Axios will set proper boundary with multipart/form-data
    headers["Content-Type"] = "multipart/form-data";
  } else {
    headers["Content-Type"] = "application/json";
  }

  if (PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT.trim()}`;
  } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    headers["pinata_api_key"] = PINATA_API_KEY.trim();
    headers["pinata_secret_api_key"] = PINATA_SECRET_KEY.trim();
  }

  return headers;
}

/**
 * Generates the full public gateway URL for an IPFS CID
 * @param {string} cid - The IPFS content identifier (hash)
 * @returns {string} Public gateway URL
 */
export function getIPFSGatewayUrl(cid) {
  if (!cid) return "";
  const cleanedCid = cid.trim().replace(/^ipfs:\/\//, "");
  const baseGateway = PINATA_GATEWAY.replace(/\/+$/, "");
  return `${baseGateway}/${cleanedCid}`;
}

/**
 * Uploads a property deed PDF, survey map, or title document directly to Pinata IPFS.
 *
 * @param {File|Blob} file - The file to upload (PDF, PNG, JPG, etc.)
 * @param {Object} [metadata={}] - Custom metadata attributes (e.g., landAddress, areaSqFt, owner)
 * @param {Function} [onProgress] - Optional upload progress callback: (percent: number) => void
 * @returns {Promise<{ ipfsHash: string, gatewayUrl: string, pinSize: number, timestamp: string }>}
 */
export async function uploadDeedToIPFS(file, metadata = {}, onProgress = null) {
  if (!file) {
    throw new Error("No file provided for IPFS upload.");
  }

  // Validate API configuration
  const hasJwt = Boolean(PINATA_JWT);
  const hasKeySecret = Boolean(PINATA_API_KEY && PINATA_SECRET_KEY);

  if (!hasJwt && !hasKeySecret) {
    throw new Error(
      "Pinata credentials missing! Please configure VITE_PINATA_JWT or VITE_PINATA_API_KEY & VITE_PINATA_SECRET_KEY in your .env file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  // Pinata metadata payload
  const pinataMetadata = JSON.stringify({
    name: metadata.fileName || file.name || `LandDeed-${Date.now()}`,
    keyvalues: {
      project: "LandBlock",
      documentType: metadata.documentType || "Property Title Deed",
      propertyLocation: metadata.location || "Unspecified",
      areaSqFt: metadata.areaSqFt ? String(metadata.areaSqFt) : "0",
      uploadedAt: new Date().toISOString(),
      ...metadata.customKeyValues,
    },
  });
  formData.append("pinataMetadata", pinataMetadata);

  // Pinata pinning options (CIDv1 is supported, default v0)
  const pinataOptions = JSON.stringify({
    cidVersion: 0,
    wrapWithDirectory: false,
  });
  formData.append("pinataOptions", pinataOptions);

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: getPinataHeaders(true),
        maxBodyLength: "Infinity",
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const gatewayUrl = getIPFSGatewayUrl(ipfsHash);

    return {
      ipfsHash,
      gatewayUrl,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    const errorMsg =
      error.response?.data?.error?.details ||
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to upload document to Pinata IPFS.";

    console.error("Pinata Upload Error:", error);
    throw new Error(errorMsg);
  }
}

/**
 * Validates connectivity and credentials with Pinata API.
 * @returns {Promise<boolean>}
 */
export async function testPinataAuthentication() {
  try {
    const headers = getPinataHeaders(false);
    const response = await axios.get(
      "https://api.pinata.cloud/data/testAuthentication",
      { headers }
    );
    return response.status === 200;
  } catch (error) {
    console.warn("Pinata Authentication Test Failed:", error.message);
    return false;
  }
}
