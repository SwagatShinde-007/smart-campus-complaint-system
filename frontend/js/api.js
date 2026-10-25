/* Shared helpers: API client, session handling, small UI utilities */

// Automatically switch between local backend and live Render backend based on environment
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8080/api"
  : "https://smart_campus-backend-a9uy.onrender.com/api";

const CATEGORIES = {
  INFRASTRUCTURE: "Infrastructure", HOSTEL: "Hostel", ACADEMIC: "Academic",
  CANTEEN: "Canteen", TRANSPORT: "Transport", IT_NETWORK: "IT & Network",
  SANITATION: "Sanitation", SECURITY: "Security", OTHER: "Other"
};
const PRIORITIES = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };
const STATUSES = { PENDING: "Pending", IN_PROGRESS: "In progress", RESOLVED: "Resolved", REJECTED: "Rejected" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
  : "";

function fillSelect(el, map, placeholder) {
  const first = placeholder ? `<option value="">${esc(placeholder)}</option>` : "";
  el.innerHTML = first + Object.entries(map)
    .map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
}

let toastTimer;
function toast(message, type = "ok") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = type === "error" ? "error" : "";
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3500);
}

const Session = {
  token: () => localStorage.getItem("token"),
  user: () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } },
  save(auth) {
    localStorage.setItem("token", auth.token);
    localStorage.setItem("user", JSON.stringify({ id: auth.id, name: auth.name, email: auth.email, role: auth.role }));
  },
  clear() { localStorage.removeItem("token"); localStorage.removeItem("user"); }
};

function homeFor(role) { return role === "ADMIN" ? "admin.html" : "student.html"; }

function logout() { Session.clear(); window.location.href = "index.html"; }

/** Call at the top of a protected page. Returns the user, or redirects. */
function requireAuth(role) {
  const user = Session.user();
  if (!Session.token() || !user) { window.location.href = "index.html"; return null; }
  if (role && user.role !== role) { window.location.href = homeFor(user.role); return null; }
  const nameEl = document.getElementById("userName");
  if (nameEl) nameEl.textContent = user.name;
  const out = document.getElementById("logoutBtn");
  if (out) out.addEventListener("click", logout);
  return user;
}

const Api = {
  async request(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    if (Session.token()) headers.Authorization = "Bearer " + Session.token();

    let res;
    try {
      res = await fetch(API_BASE + path, { ...options, headers });
    } catch {
      throw new Error("Cannot reach the server. Check that the backend is running at " + API_BASE);
    }

    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }

    if (res.status === 401 && !path.startsWith("/auth/")) { logout(); throw new Error("Session expired. Please log in again."); }
    if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
    return data;
  },
  get: (p) => Api.request(p),
  post: (p, body) => Api.request(p, { method: "POST", body: JSON.stringify(body) }),
  put: (p, body) => Api.request(p, { method: "PUT", body: JSON.stringify(body) }),
  del: (p) => Api.request(p, { method: "DELETE" })
};