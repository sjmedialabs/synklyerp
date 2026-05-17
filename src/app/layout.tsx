import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SynklyERP | Multi-Tenant SaaS Platform",
  description: "Enterprise-grade multi-module ERP platform for product, service, and hybrid businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} font-sans antialiased`}
      style={{ fontFamily: 'var(--font-google-sans)' }}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background text-foreground"
        style={{ fontFamily: 'inherit' }}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
