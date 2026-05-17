export const AUTH_SESSION_EVENT = "auth-session-changed";

function readStoredValue(key: "access_token" | "refresh_token") {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(key);
  return value && value !== "undefined" && value !== "null" ? value : null;
}

function emitAuthSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function getAccessToken() {
  const token = readStoredValue("access_token");

  if (!token) {
    logout();
    return null;
  }

  return token;
}

export function getStoredAccessToken() {
  return readStoredValue("access_token");
}

export function hasActiveSession() {
  return Boolean(readStoredValue("access_token"));
}

export function setAuthSession(tokens: {
  accessToken: string;
  refreshToken?: string | null;
}) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("access_token", tokens.accessToken);

  if (tokens.refreshToken) {
    window.localStorage.setItem("refresh_token", tokens.refreshToken);
  } else {
    window.localStorage.removeItem("refresh_token");
  }

  emitAuthSessionChange();
}

export function logout() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
  emitAuthSessionChange();
}

export function clearInvalidSession() {
  logout();
}

export function authErrorMessage() {
  return "Session expired or invalid. Please sign in again.";
}