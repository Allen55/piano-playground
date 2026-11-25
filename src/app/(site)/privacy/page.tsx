import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "What data this site handles. There are no ads, accounts or tracking cookies.", alternates: { canonical: "/privacy/" } };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="lede">{SITE_NAME} does not require an account and does not ask you for personal information.</p>
      <h2>Information the site handles</h2>
      <p>The site's hosting provider keeps standard server logs (such as IP address, browser type and the pages requested) for security and operations. The Studio can save progressions; these are stored in your own browser using local storage and are not sent to the site. If you choose the Piano sound, the browser downloads piano sample files from the host named in the site's configuration, which can see your IP address in the same way as any file host. Your Synth or Piano choice is remembered in local storage.</p>
      <h2>No ads or tracking</h2>
      <p>The site shows no advertising and loads no advertising or tracking code.</p>
      <h2>Your choices</h2>
      <p>Everything the site remembers is kept in your browser's local storage. You can clear it at any time in your browser settings.</p>
      <h2>Contact</h2>
      <p>For privacy questions, see the <Link href="/contact/">contact page</Link>.</p>
    </>
  );
}
