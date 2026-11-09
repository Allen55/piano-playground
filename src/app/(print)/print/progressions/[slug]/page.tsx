import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgressionSheet } from "@/components/progression-sheet";
import { PROGRESSIONS, getProgression } from "@/lib/progressions";

export const dynamicParams = false;
export function generateStaticParams() { return PROGRESSIONS.map(p => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProgression((await params).slug);
  if (!p) notFound();
  return { title: `${p.name} progression sheet (print)`, alternates: { canonical: `/progressions/${p.slug}/` } };
}

export default async function ProgressionPrint({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProgression(slug)) notFound();
  return <ProgressionSheet slug={slug} />;
}
