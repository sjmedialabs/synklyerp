import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  schemaJson: Record<string, unknown> | null;
  publishedAt: string | null;
  updatedAt: string;
};

function mapPage(row: Record<string, unknown>): CmsPage {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    status: row.status as string,
    contentHtml: (row.content_html as string | null) ?? null,
    metaTitle: (row.meta_title as string | null) ?? null,
    metaDescription: (row.meta_description as string | null) ?? null,
    ogImageUrl: (row.og_image_url as string | null) ?? null,
    schemaJson: (row.schema_json as Record<string, unknown> | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

export async function listCmsPages() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("id, title, slug, status, meta_title, updated_at, published_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    status: r.status as string,
    metaTitle: (r.meta_title as string | null) ?? null,
    updatedAt: r.updated_at as string,
    publishedAt: (r.published_at as string | null) ?? null,
  }));
}

export async function getCmsPageBySlug(slug: string, publishedOnly = true): Promise<CmsPage | null> {
  const supabase = createAdminClient();
  let query = supabase.from("cms_pages").select("*").eq("slug", slug).is("deleted_at", null);
  if (publishedOnly) query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data ? mapPage(data as Record<string, unknown>) : null;
}

export async function getCmsPageById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("cms_pages").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  return data ? mapPage(data as Record<string, unknown>) : null;
}

export async function upsertCmsPage(input: {
  id?: string;
  title: string;
  slug: string;
  status: string;
  contentHtml?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  schemaJson?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    title: input.title,
    slug: input.slug,
    status: input.status,
    content_html: input.contentHtml ?? null,
    meta_title: input.metaTitle ?? null,
    meta_description: input.metaDescription ?? null,
    og_image_url: input.ogImageUrl ?? null,
    schema_json: input.schemaJson ?? null,
    updated_at: now,
    published_at: input.status === "published" ? now : null,
  };

  if (input.id) {
    const { data, error } = await supabase.from("cms_pages").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    return mapPage(data as Record<string, unknown>);
  }

  const { data, error } = await supabase.from("cms_pages").insert(payload).select().single();
  if (error) throw error;
  return mapPage(data as Record<string, unknown>);
}

export async function deleteCmsPage(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("cms_pages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return { id };
}
