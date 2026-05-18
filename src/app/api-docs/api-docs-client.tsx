"use client";

import { useEffect } from "react";
import Link from "next/link";

type SwaggerUIBundleType = ((config: Record<string, unknown>) => void) & {
  presets: { apis: unknown };
  SwaggerUIStandalonePreset: unknown;
};

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleType;
  }
}

export function ApiDocsClient() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (!window.SwaggerUIBundle) return;
      window.SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        tryItOutEnabled: true,
        persistAuthorization: true,
      });
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  return (
    <>
      <header className="border-b border-slate-200 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Developer</p>
            <h1 className="text-lg font-bold text-slate-900">SynklyERP API Reference</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Session cookie auth · Module-gated routes return <code className="text-violet-700">MODULE_DISABLED</code>
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            ← Back to site
          </Link>
        </div>
      </header>
      <div id="swagger-ui" className="min-h-[calc(100vh-72px)]" />
    </>
  );
}
