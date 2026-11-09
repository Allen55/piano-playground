import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { sitePaths } from "@/lib/site-paths";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitePaths().map(path => ({ url: new URL(path, SITE_URL).toString() }));
}
