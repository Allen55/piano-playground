import "./print.css";
import type { Metadata } from "next";

// Print views duplicate the key and progression pages, so they stay out of search results.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="print-root">{children}</div>;
}
