// Minimal consent store: "granted" | "denied" | "unset" (nothing chosen yet). Persisted in localStorage when available.
export type Consent = "granted" | "denied" | "unset";
const KEY = "ad-consent";
const EVENT = "ad-consent-change";

export function readConsent(): Consent {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch { return "unset"; }
}

export function writeConsent(value: Consent): void {
  try { if (value === "unset") window.localStorage.removeItem(KEY); else window.localStorage.setItem(KEY, value); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}
