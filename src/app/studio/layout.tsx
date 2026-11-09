import type { Metadata } from "next";
export const metadata: Metadata = { title: "Studio", description: "Explore harmony, practice voicings, and make music at the keys.", alternates: { canonical: "/studio/" } };
export default function StudioLayout({ children }: { children: React.ReactNode }) { return children; }
