import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as cmsRepo from "@/repositories/platform/cms-pages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await cmsRepo.getCmsPageBySlug(slug, true);
  if (!page) return { title: "Page not found" };
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    openGraph: page.ogImageUrl ? { images: [page.ogImageUrl] } : undefined,
  };
}

export default async function PublicCmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await cmsRepo.getCmsPageBySlug(slug, true);
  if (!page) notFound();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="font-bold text-[#1B1538]">
            SynklyERP
          </Link>
          <Link href="/signup" className="text-sm font-medium text-indigo-600 hover:underline">
            Get started
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        {page.contentHtml ? (
          <div
            className="prose prose-slate mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <p className="mt-8 text-slate-600">This page has no content yet.</p>
        )}
      </article>
    </div>
  );
}
