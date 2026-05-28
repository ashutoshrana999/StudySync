import { apiFetch } from "./api.js";
import { loadAuth, saveAuth, clearAuth } from "./storage.js";

export function getAuth() {
  return loadAuth();
}

export async function login({ email, password, remember }) {
  const data = await apiFetch("/auth/login", { method: "POST", body: { email, password, remember }, auth: false });
  saveAuth({ token: data.token, user: data.user, remember });
  return data;
}

export async function register({ name, email, phone, password, remember }) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: { name, email, phone, password, remember },
    auth: false
  });
  saveAuth({ token: data.token, user: data.user, remember });
  return data;
}

export function logout() {
  clearAuth();
}

export function requireAuth() {
  const auth = loadAuth();
  if (!auth?.token) {
    window.location.href = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}/index.html`;
    return null;
  }
  return auth;
}

export function requireRole(role) {
  const auth = requireAuth();
  if (!auth) return null;
  if (auth.user?.role !== role) {
    window.location.href = role === "admin" ? "./admin/index.html" : "./student/index.html";
    return null;
  }
  return auth;
}

