import type { Metadata } from "next";
import Link from "next/link";
import { allKeys, keySlug } from "@/lib/reference";
import { keyName } from "@/lib/keys";

export const metadata: Metadata = { title: "Piano Keys: Scales and Chords in All 24 Keys", alternates: { canonical: "/keys/" } };

export default function KeysIndex() {
  const keys = allKeys();
  return (
    <>
      <h1>Piano keys</h1>
      <p className="lede">Pick a key to see its scale, its seven chords and every inversion on the keyboard.</p>
      {(["major", "minor"] as const).map(mode => (
        <section key={mode}>
          <h2>{mode === "major" ? "Major keys" : "Minor keys"}</h2>
          <div className="chord-grid">{keys.filter(k => k.mode === mode).map(k => <Link key={keySlug(k)} href={`/keys/${keySlug(k)}/`}>{keyName(k)}</Link>)}</div>
        </section>
      ))}
    </>
  );
}
