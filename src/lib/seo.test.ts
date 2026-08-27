import { describe, expect, it } from "vitest";
import { breadcrumbLd, pageMetadata, webPageLd } from "./seo";
import { licensePath } from "./site";

describe("SEO helpers", () => {
  it("creates an indexable canonical page", () => {
    const metadata = pageMetadata({
      title: "HVAC replacement cost guide",
      description: "A useful local cost guide.",
      path: "/services/hvac-replacement",
    });

    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/services/hvac-replacement");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe("http://localhost:3000/services/hvac-replacement");
  });

  it("creates explicit noindex metadata for utility pages", () => {
    const metadata = pageMetadata({ title: "Private form", description: "Private form.", path: "/claim", noindex: true });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keeps schema URLs on the same canonical path", () => {
    const path = licensePath("fl-license/1");
    expect(path).toBe("/licenses/fl-license%2F1");
    expect(webPageLd({ name: "Record", description: "Record", path }).url).toBe("http://localhost:3000/licenses/fl-license%2F1");
    expect(breadcrumbLd([{ name: "Record", href: path }]).itemListElement[0].item).toBe("http://localhost:3000/licenses/fl-license%2F1");
  });
});
