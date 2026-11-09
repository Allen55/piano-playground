import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "What data this site collects, how advertising works and how to change your choices.", alternates: { canonical: "/privacy/" } };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="lede">{SITE_NAME} does not require an account and does not ask you for personal information.</p>
      <h2>Information the site handles</h2>
      <p>The site's hosting provider keeps standard server logs (such as IP address, browser type and the pages requested) for security and operations. The Studio can save progressions; these are stored in your own browser using local storage and are not sent to the site.</p>
      <h2>Advertising</h2>
      <p>The site is supported by advertising. Ads are loaded only after you choose "Accept ads". If you choose "No ads", no advertising code is loaded. When ads are shown, Google and its partners may use cookies or similar technologies to serve and measure ads, which can include ads based on your visits to this and other sites. You can read how Google uses data from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>, and manage ad personalization at <a href="https://adssettings.google.com" rel="noopener noreferrer">adssettings.google.com</a>.</p>
      <h2>Your choices</h2>
      <p>Use the "Ad choices" link in the footer at any time to change your decision. Your choice is remembered in your browser's local storage. You can also clear cookies and site data in your browser settings.</p>
      <h2>Contact</h2>
      <p>For privacy questions, see the <Link href="/contact/">contact page</Link>.</p>
    </>
  );
}
