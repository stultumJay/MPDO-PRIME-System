import { useSyncExternalStore } from "react";
import { AUTH_SESSION_EVENT, hasActiveSession } from "@/services/tokenService";

type AuthSnapshot = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

let lastSnapshot: AuthSnapshot = {
  isAuthenticated: hasActiveSession(),
  isLoading: false,
};

function getSnapshot(): AuthSnapshot {
  const next = hasActiveSession();

  if (lastSnapshot.isAuthenticated !== next) {
    lastSnapshot = { isAuthenticated: next, isLoading: false };
  }

  return lastSnapshot;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener(AUTH_SESSION_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function useAuth() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}