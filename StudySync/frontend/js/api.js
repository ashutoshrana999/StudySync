import { CONFIG } from "./config.js";
import { loadAuth, clearAuth } from "./storage.js";

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const url = `${CONFIG.API_BASE}${path}`;
  const init = { method, headers: { ...headers } };

  if (auth) {
    const authData = loadAuth();
    if (authData?.token) init.headers.Authorization = `Bearer ${authData.token}`;
  }

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) {
    const msg = payload?.message || `Request failed (${res.status})`;
    if (res.status === 401) clearAuth();
    throw new ApiError(msg, res.status, payload);
  }
  return payload;
}

