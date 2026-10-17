import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = {
  // Issue short-lived cryptographic nonce
  async getNonce(walletAddress, role) {
    const res = await api.post("/auth/nonce", { walletAddress, role });
    return res.data;
  },

  // Authenticate user with password and role
  async login({ emailOrUsername, password, role }) {
    const res = await api.post("/auth/login", {
      emailOrUsername,
      password,
      role,
    });
    return res.data;
  },

  // Citizen self-registration
  async registerCitizen({ username, email, password, name, walletAddress }) {
    const res = await api.post("/auth/register-citizen", {
      username,
      email,
      password,
      name,
      walletAddress,
    });
    return res.data;
  },

  // Verify active session
  async getMe() {
    const res = await api.get("/auth/me");
    return res.data;
  },

  // Sign out
  async logout() {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  // Admin: List Officers
  async listOfficers() {
    const res = await api.get("/officers");
    return res.data;
  },

  // Admin: Provision Officer
  async provisionOfficer(data) {
    const res = await api.post("/officers/provision", data);
    return res.data;
  },

  // Admin: Deactivate Officer
  async deactivateOfficer(id) {
    const res = await api.delete(`/officers/${id}`);
    return res.data;
  },

  // Admin: Audit Logs
  async getAuditLogs() {
    const res = await api.get("/audit-logs");
    return res.data;
  },
};

export default authApi;
