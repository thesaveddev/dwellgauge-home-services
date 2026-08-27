import type { Metadata } from "next";
import { SITE_LOCALE, SITE_NAME, SITE_URL, absoluteUrl, licensePath, stateAuthorityUrl } from "./site";
import type { Faq, LicenseRecord, Service } from "./datasets";
import { hreflangAlternates, liveCountries } from "./intl";

const SOCIAL_IMAGE = absoluteUrl("/opengraph-image");

function trimDescription(description: string, max = 160): string {
  const clean = description.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
  type?: "website" | "article";
  dateModified?: string;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const description = trimDescription(opts.description);
  const languages = liveCountries().length > 1 ? hreflangAlternates(opts.path) : undefined;
  const indexed = !opts.noindex;

  return {
    title: opts.title,
    description,
    keywords: opts.keywords,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    alternates: { canonical: url, languages },
    robots: indexed
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: SITE_NAME,
      type: opts.type ?? "website",
      locale: SITE_LOCALE.replace("-", "_"),
      images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: [SOCIAL_IMAGE],
    },
    ...(opts.dateModified ? { other: { "article:modified_time": opts.dateModified } } : {}),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_LOCALE,
    publisher: { "@id": `${SITE_URL}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/licenses?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    description: "Local home project cost guides and public contractor license records.",
  };
}

export function webPageLd(opts: {
  name: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(opts.path)}#webpage`,
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    inLanguage: SITE_LOCALE,
    isPartOf: { "@id": `${SITE_URL}#website` },
    publisher: { "@id": `${SITE_URL}#organization` },
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.href),
    })),
  };
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function itemListLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}

export function serviceLd(service: Service, opts: { path: string; city?: string; state?: string }) {
  const areaName = opts.city && opts.state ? `${opts.city}, ${opts.state}` : "United States";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.tradeSlug,
    description: service.description,
    url: absoluteUrl(opts.path),
    areaServed: { "@type": "Place", name: areaName },
    provider: { "@id": `${SITE_URL}#organization` },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Planning range low", value: service.benchmark.low, unitCode: "USD" },
      { "@type": "PropertyValue", name: "Planning range high", value: service.benchmark.high, unitCode: "USD" },
    ],
  };
}

export function datasetLd(opts: {
  name: string;
  description: string;
  path: string;
  keywords: string[];
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    keywords: opts.keywords,
    creator: { "@id": `${SITE_URL}#organization` },
    temporalCoverage: new Date().getFullYear().toString(),
    isAccessibleForFree: true,
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

export function licenseRecordLd(rec: LicenseRecord, path: string) {
  const authority = stateAuthorityUrl(rec.stateCode);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: rec.businessName,
    url: absoluteUrl(path),
    address: {
      "@type": "PostalAddress",
      ...(rec.city ? { addressLocality: rec.city } : {}),
      ...(rec.stateCode ? { addressRegion: rec.stateCode } : {}),
      addressCountry: "US",
    },
    description: `${rec.classification ?? rec.trade} contractor license record in ${rec.city ?? rec.stateCode}.`,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "licenseNumber",
      value: rec.licenseNumber,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "License status", value: rec.status },
      { "@type": "PropertyValue", name: "Trade", value: rec.trade },
      { "@type": "PropertyValue", name: "Official verification source", value: authority },
    ],
  };
}

export function localBusinessLd(rec: LicenseRecord, path = licensePath(rec.id)) {
  return licenseRecordLd(rec, path);
}

export function articleLd(opts: { title: string; description: string; path: string; date: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date,
    dateModified: opts.date,
    author: { "@id": `${SITE_URL}#organization` },
    publisher: { "@id": `${SITE_URL}#organization` },
    mainEntityOfPage: absoluteUrl(opts.path),
  };
}
