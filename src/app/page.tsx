import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { LandingJsonLd } from "@/components/landing/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://synklyerp.com";

export const metadata: Metadata = {
  title: "SynklyERP | Multi-Tenant Enterprise ERP for HR, Finance & Sales",
  description:
    "Unify HR, Finance, Organisation, Sales, and Projects in one PostgreSQL-backed multi-tenant ERP. Product, service, and hybrid businesses. Start your 14-day free trial.",
  keywords: [
    "ERP software",
    "multi-tenant SaaS",
    "HR management",
    "finance ERP",
    "CRM",
    "project management",
    "India ERP",
  ],
  openGraph: {
    title: "SynklyERP — Enterprise ERP for modern teams",
    description:
      "Organise, manage, pay & scale your business with modular HR, Finance, Sales, and Projects.",
    url: SITE_URL,
    siteName: "SynklyERP",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SynklyERP — Enterprise ERP",
    description: "Multi-tenant ERP built for product, service, and hybrid organisations.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  );
}
