import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "How to reach the site owner with corrections or questions.", alternates: { canonical: "/contact/" } };

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>
      <p className="lede">Questions, corrections or requests for {SITE_NAME}.</p>
      {EMAIL ? <p>Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p> : <p>A contact address will be published here at launch.</p>}
    </>
  );
}
