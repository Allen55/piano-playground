import Link from "next/link";
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
      <footer className="site-footer"><div className="site-footer-inner"><span>© {SITE_NAME}</span><span>Piano chords, keys and scales</span></div></footer>
    </div>
  );
}
