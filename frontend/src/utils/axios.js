import axios from "axios";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

const api = axios.create({
  baseURL: backendUrl || undefined,
  withCredentials: true,
  timeout: 30000,
});

export default api;
