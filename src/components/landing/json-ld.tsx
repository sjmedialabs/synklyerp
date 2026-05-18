const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://synklyerp.com";

export function LandingJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "SynklyERP",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.ico`,
        description:
          "Multi-tenant enterprise ERP for HR, Finance, Organisation, Sales, and Projects.",
      },
      {
        "@type": "SoftwareApplication",
        name: "SynklyERP",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          description: "14-day free trial",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
