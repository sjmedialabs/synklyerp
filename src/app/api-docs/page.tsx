import type { Metadata } from "next";
import { ApiDocsClient } from "./api-docs-client";

export const metadata: Metadata = {
  title: "API Reference | SynklyERP",
  description: "OpenAPI documentation for the SynklyERP REST API",
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ApiDocsClient />
    </div>
  );
}
