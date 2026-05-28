const KEY = "studysync_auth";
const KEY_SESSION = "studysync_auth_session";

export function saveAuth({ token, user, remember }) {
  const payload = JSON.stringify({ token, user, savedAt: Date.now() });
  if (remember) {
    localStorage.setItem(KEY, payload);
    sessionStorage.removeItem(KEY_SESSION);
  } else {
    sessionStorage.setItem(KEY_SESSION, payload);
    localStorage.removeItem(KEY);
  }
}

export function loadAuth() {
  const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY_SESSION);
}

