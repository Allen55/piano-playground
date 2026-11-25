import type { Metadata } from "next";
import Link from "next/link";
import { FAMILIES, SCALES, scaleHref, scalePages, scaleSpelling } from "@/lib/scales";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Piano Scales and Modes in Every Key: Major, Minor, Blues, Pentatonic & More",
  description: `${SCALES.length} scales and modes in all 12 keys, each written on the staff and shown on the piano keyboard: the major modes, minor scales, pentatonic, blues, jazz, symmetric and world scales.`,
  alternates: { canonical: "/scales/" },
};

export default function ScalesIndex() {
  const pages = scalePages();
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / Scales</p>
      <h1>Piano scales and modes</h1>
      <p className="lede">{SCALES.length} scales and modes in all 12 keys. Every page writes the scale on the treble and bass staff, shows it on the keyboard, lists its intervals and plays it for you.</p>
      <p>Jump to: {FAMILIES.map((f, i) => <span key={f.id}>{i > 0 && " · "}<a href={`#${f.id}`}>{f.name}</a></span>)}</p>
      {FAMILIES.map((f) => (
        <section key={f.id} id={f.id}>
          <h2>{f.name}</h2>
          <p>{f.blurb}</p>
          <div className="table-scroll">
            <table className="data-table scale-table">
              <thead><tr><th>Scale</th><th>Formula</th><th>On C</th><th>All keys</th></tr></thead>
              <tbody>
                {SCALES.filter(s => s.family === f.id).map(s => {
                  const keys = pages.filter(p => p.scale.id === s.id);
                  return (
                    <tr key={s.id}>
                      <td><Link href={scaleHref(keys[0])}><strong>{s.name}</strong></Link>{s.aka && <><br /><small style={{ color: "#8d9ba2" }}>{s.aka.join(", ")}</small></>}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{s.formula}</td>
                      <td>{scaleSpelling("C", s).join(" ")}</td>
                      <td>{keys.map(p => <Link key={p.tonic} className="chip" href={scaleHref(p)}>{p.tonic}</Link>)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
