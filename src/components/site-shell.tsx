import Link from "next/link";
import { ConsentBanner, PrivacySettingsButton } from "@/components/consent-banner";
import { SITE_NAME } from "@/lib/site";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand">{SITE_NAME}<span>.</span></Link>
          <nav className="site-nav" aria-label="Main">
            <Link href="/keys/">Keys</Link>
            <Link href="/chords/">Chords</Link>
            <Link href="/studio/">Studio</Link>
          </nav>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>© {SITE_NAME}</span>
          <span style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/about/">About</Link>
            <Link href="/privacy/">Privacy</Link>
            <Link href="/contact/">Contact</Link>
            <PrivacySettingsButton />
          </span>
        </div>
      </footer>
      <ConsentBanner />
    </div>
  );
}
