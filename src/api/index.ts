import axios from "axios";
import { auth } from "../config/firebase";

// Get Firebase project ID and region from environment
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id";
const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";

// Determine base URL based on environment
const isDevelopment = import.meta.env.MODE === "development";
const baseURL = isDevelopment
  ? `http://localhost:5001/${projectId}/${region}`
  : `https://${region}-${projectId}.cloudfunctions.net`;

// Create an instance of axios
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to include Firebase ID token in requests
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get the current user and their ID token
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (error) {
        console.error("Error getting ID token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
