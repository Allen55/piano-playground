import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Keyframe — Piano Playground", description: "Explore harmony, practice voicings, and make music at the keys." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
