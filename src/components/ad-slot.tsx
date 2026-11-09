"use client";

import "./consent.css";
import { useEffect, useRef } from "react";
import { useConsent } from "@/components/consent-banner";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

declare global { interface Window { adsbygoogle?: unknown[] } }

function loadScript(): void {
  if (!CLIENT || document.querySelector("script[data-adsense]")) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "1";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  document.head.appendChild(script);
}

/**
 * A below-the-fold ad unit. Renders nothing until an AdSense client id is configured and the visitor accepted ads,
 * so there is no empty gap before launch. Never place it above the keyboard diagram.
 */
export function AdSlot() {
  const consent = useConsent();
  const pushed = useRef(false);
  const active = Boolean(CLIENT && SLOT) && consent === "granted";
  useEffect(() => {
    if (!active) return;
    loadScript();
    if (!pushed.current) { pushed.current = true; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* blocked */ } }
  }, [active]);
  if (!active) return null;
  return (
    <aside className="ad-slot" aria-label="Advertisement">
      <small>Advertisement</small>
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={CLIENT} data-ad-slot={SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}
