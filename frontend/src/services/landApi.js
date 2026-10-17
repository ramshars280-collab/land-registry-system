import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("terrachain_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Upload deed document to local storage adapter
 */
export async function uploadDocumentToStorage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const res = await api.post("/storage/upload", {
          filename: file.name,
          mimeType: file.type || "application/pdf",
          base64Data,
        });
        resolve(res.data);
      } catch (err) {
        reject(err.response?.data?.error || err.message || "Failed to upload document.");
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Get direct URL for deed document
 */
export function getDeedDocumentUrl(cid) {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) {
    return cid;
  }
  if (cid.startsWith("Qm") || cid.startsWith("bafy")) {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  return `${API_BASE}/storage/document/${cid}`;
}

/**
 * Smart Contract Execution Operations via Authenticated Backend
 */
export const landApi = {
  // Register land
  registerLand: async (data) => {
    const res = await api.post("/blockchain/land/register", data);
    return res.data;
  },

  // Inspector verify land
  verifyLand: async (landId) => {
    const res = await api.post(`/blockchain/land/${landId}/verify`);
    return res.data;
  },

  // Registrar certify title
  certifyTitle: async (landId) => {
    const res = await api.post(`/blockchain/land/${landId}/certify`);
    return res.data;
  },

  // Citizen list for sale
  listLand: async (landId, priceEth) => {
    const res = await api.post(`/blockchain/land/${landId}/list`, { priceEth });
    return res.data;
  },

  // Citizen delist
  delistLand: async (landId) => {
    const res = await api.post(`/blockchain/land/${landId}/delist`);
    return res.data;
  },

  // Citizen buy land with ETH
  buyLand: async (landId) => {
    const res = await api.post(`/blockchain/land/${landId}/buy`);
    return res.data;
  },

  // Admin add officer
  addOfficer: async (officerAddress, role) => {
    const res = await api.post("/blockchain/officer/add", { officerAddress, role });
    return res.data;
  },
};

export default landApi;
