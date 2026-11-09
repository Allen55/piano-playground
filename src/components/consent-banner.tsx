"use client";

import "./consent.css";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { readConsent, subscribeConsent, writeConsent, type Consent } from "@/lib/consent";

export function useConsent(): Consent | "loading" {
  return useSyncExternalStore(subscribeConsent, readConsent, () => "loading" as const);
}

export function ConsentBanner() {
  const consent = useConsent();
  if (consent !== "unset") return null; // hidden during server render and once a choice exists
  return (
    <div className="consent" role="dialog" aria-label="Advertising choices">
      <p>This site shows ads to stay free. Ads are only loaded if you accept; ad providers may use cookies. Reading and the piano tools work either way. See the <Link href="/privacy/" style={{ color: "#8abce8" }}>privacy policy</Link>.</p>
      <div className="consent-actions">
        <button type="button" className="primary" onClick={() => writeConsent("granted")}>Accept ads</button>
        <button type="button" onClick={() => writeConsent("denied")}>No ads</button>
      </div>
    </div>
  );
}

export function PrivacySettingsButton() {
  return <button type="button" className="link-button" onClick={() => writeConsent("unset")}>Ad choices</button>;
}
