"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value?: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
};

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

async function compressImage(file: File, maxWidth = 800): Promise<File> {
  if (file.type === "image/svg+xml" || file.type === "image/webp") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

export function LogoUploader({ value, disabled, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Use PNG, JPG, WEBP, or SVG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be 2MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const prepared = file.type.startsWith("image/") && file.type !== "image/svg+xml"
        ? await compressImage(file)
        : file;
      const formData = new FormData();
      formData.append("logo", prepared);
      const res = await fetch("/api/company-profile/logo", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
      onUploaded((json.data as { logoUrl: string }).logoUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Company logo preview" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <Upload className="h-8 w-8 text-slate-300" />
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload Logo"}
          </Button>
          <p className="mt-2 text-xs text-slate-500">PNG, JPG, WEBP, or SVG · Max 2MB · Auto-compressed</p>
          {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
