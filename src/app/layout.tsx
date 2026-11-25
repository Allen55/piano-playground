import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Piano Playground: Piano Chords, Keys and Scales", template: "%s | Piano Playground" }, description: "Piano chords, keys and scales with keyboard diagrams, plus an interactive progression studio." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
