// Set window.CAMPUS_API_BASE before this script to override the API URL.
const API_BASE = window.CAMPUS_API_BASE
  ? window.CAMPUS_API_BASE.replace(/\/+$/, "")
  : `${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:8080"
      : "https://smart-campus-backend-a9uy.onrender.com"}/api`;
