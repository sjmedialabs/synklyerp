"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type CmsListItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
};

type CmsPageDetail = CmsListItem & {
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
};

const empty = {
  title: "",
  slug: "",
  status: "draft",
  contentHtml: "",
  metaTitle: "",
  metaDescription: "",
  ogImageUrl: "",
};

export default function SuperAdminCmsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["superadmin-cms"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/cms/pages");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as CmsListItem[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = { ...form, id: editingId ?? undefined, ogImageUrl: form.ogImageUrl || undefined };
      const res = await fetch(
        editingId ? `/api/superadmin/cms/pages/${editingId}` : "/api/superadmin/cms/pages",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-cms"] });
      toast.success(editingId ? "Page updated" : "Page created");
      setOpen(false);
      setEditingId(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openEdit = async (id: string) => {
    const res = await fetch(`/api/superadmin/cms/pages/${id}`);
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error?.message ?? "Failed to load");
      return;
    }
    const p = json.data as CmsPageDetail;
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      status: p.status,
      contentHtml: p.contentHtml ?? "",
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      ogImageUrl: p.ogImageUrl ?? "",
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CMS Pages</h1>
          <p className="mt-1 text-sm text-slate-400">Public pages at /p/[slug] when published.</p>
        </div>
        <Button
          className="bg-indigo-600"
          onClick={() => {
            setEditingId(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" /> New Page
        </Button>
      </div>

      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              {["Title", "Slug", "Status", "Updated", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">
                  <a href={`/p/${p.slug}`} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
                    /p/{p.slug}
                  </a>
                </td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => openEdit(p.id)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit Page" : "Create Page"} size="lg">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </Select>
          </div>
          <div>
            <Label>Content (HTML)</Label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono"
              rows={8}
              value={form.contentHtml}
              onChange={(e) => setForm((f) => ({ ...f, contentHtml: e.target.value }))}
            />
          </div>
          <div><Label>Meta title</Label><Input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} /></div>
          <div><Label>Meta description</Label><Input value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} /></div>
          <div><Label>OG image URL</Label><Input value={form.ogImageUrl} onChange={(e) => setForm((f) => ({ ...f, ogImageUrl: e.target.value }))} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} className="bg-indigo-600">
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
