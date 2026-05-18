import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://synklyerp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/superadmin/", "/onboarding/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
