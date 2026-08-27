import type { MetadataRoute } from "next";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { absoluteUrl, licensePath } from "@/lib/site";
import { listServices, listMetros, listLicenseIdsAsync } from "@/lib/datasets";
import { hreflangAlternates, liveCountries } from "@/lib/intl";

const MAX_URLS = 49_000;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const modified = dataModifiedAt();
  const urls: MetadataRoute.Sitemap = [];
  const add = (path: string, options: Omit<Entry, "url"> = {}) => {
    if (urls.length >= MAX_URLS) return;
    urls.push({ url: absoluteUrl(path), lastModified: modified, ...options });
  };

  const staticPages: Array<[string, Entry["changeFrequency"], number]> = [
    ["/", "weekly", 1],
    ["/costs", "monthly", 0.9],
    ["/methodology", "monthly", 0.7],
    ["/how-it-works", "monthly", 0.7],
    ["/data-sources", "monthly", 0.7],
    ["/faq", "monthly", 0.6],
    ["/about", "monthly", 0.5],
    ["/contact", "monthly", 0.4],
    ["/tools/hvac-calculator", "monthly", 0.8],
    ["/get-quotes", "monthly", 0.7],
    ["/get-listed", "monthly", 0.5],
    ["/privacy", "yearly", 0.2],
    ["/terms", "yearly", 0.2],
    ["/disclaimer", "yearly", 0.2],
  ];
  for (const [path, changeFrequency, priority] of staticPages) {
    add(path, { changeFrequency, priority, alternates: alternatesFor(path) });
  }
  const licenseIds = await listLicenseIdsAsync(MAX_URLS);
  if (licenseIds.length > 0) {
    add("/licenses", { changeFrequency: "weekly", priority: 0.8, alternates: alternatesFor("/licenses") });
  }

  for (const service of listServices()) {
    const servicePath = `/services/${service.slug}`;
    add(servicePath, { changeFrequency: "monthly", priority: 0.9, alternates: alternatesFor(servicePath) });
    for (const metro of listMetros()) {
      const path = `/costs/${service.slug}/${metro.slug}`;
      add(path, { changeFrequency: "monthly", priority: 0.8, alternates: alternatesFor(path) });
    }
  }

  const remaining = MAX_URLS - urls.length;
  for (const id of licenseIds.slice(0, Math.max(0, remaining))) {
    add(licensePath(id), { changeFrequency: "monthly", priority: 0.5 });
  }

  return urls;
}

function alternatesFor(path: string): Entry["alternates"] {
  if (liveCountries().length <= 1) return undefined;
  return { languages: hreflangAlternates(path) };
}

function dataModifiedAt(): Date {
  const candidates = [
    join(process.cwd(), "data", "services.json"),
    join(process.cwd(), "data", "metros.json"),
    join(process.cwd(), "data", "generated", "cost-estimates.json"),
    join(process.cwd(), "data", "generated", "wage-ratios.json"),
  ];
  try {
    const licenseDir = join(process.cwd(), "data", "licenses");
    for (const file of readdirSync(licenseDir)) candidates.push(join(licenseDir, file));
  } catch {
    // The generated license directory is optional on a fresh checkout.
  }
  const timestamps = candidates.flatMap((file) => {
    try { return [statSync(file).mtimeMs]; } catch { return []; }
  });
  return new Date(Math.max(...timestamps, 0) || Date.now());
}
