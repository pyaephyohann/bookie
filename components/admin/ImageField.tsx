"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COVER_MAX_BYTES,
  COVER_MIME_TYPES,
  isAllowedCoverSize,
  isAllowedCoverType,
} from "@/lib/admin/catalog";

interface ImageFieldProps {
  label: string;
  /** Field names must match `resolveImageField` in lib/admin/uploads.ts. */
  actionName?: string;
  fileName?: string;
  urlName?: string;
  /** Current stored value (may be an /uploads path, an https URL, or ""). */
  initialUrl: string;
  /** Hint shown under the control. */
  hint?: string;
  /** Aspect ratio class for the preview box. */
  aspectClassName?: string;
  /** Label for the manual URL input. */
  urlLabel?: string;
  /** Accessible text when nothing is selected. */
  emptyLabel?: string;
}

/**
 * Image picker used by the admin author/category forms: client-side preview,
 * server-side validation/storage, optional manual URL, and removal.
 */
export function ImageField({
  label,
  actionName = "imageAction",
  fileName = "imageFile",
  urlName = "imageUrl",
  initialUrl,
  hint,
  aspectClassName = "aspect-square",
  urlLabel = "Or use an image URL",
  emptyLabel = "No image selected",
}: ImageFieldProps) {
  const [action, setAction] = useState<"keep" | "replace" | "remove">("keep");
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [fileName_, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxMb = Math.round(COVER_MAX_BYTES / (1024 * 1024));

  // A stored upload is shown in the preview; the URL field starts empty so we
  // never render a giant path/URL into the form for an upload-managed image.
  const isManagedUpload = initialUrl.startsWith("/uploads/");

  const onPick = (file: File | null) => {
    if (!file) return;

    // Client-side guard only — it saves a doomed request and gives a friendly
    // message. The server re-validates everything (MIME, size, magic numbers).
    const problem = !isAllowedCoverType(file.type)
      ? "Choose a JPEG, PNG or WEBP image."
      : !isAllowedCoverSize(file.size)
        ? `Image must be ${maxMb} MB or smaller.`
        : null;

    if (problem) {
      setError(problem);
      setFileName("");
      // Drop the rejected file so it can never be submitted with the form.
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setAction("replace");
  };

  const onRemove = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setError(null);
    setAction("remove");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input type="hidden" name={actionName} value={action} />
      <p className="text-label mb-1 block text-text">{label}</p>

      <div className="flex items-start gap-4">
        <div
          className={`flex ${aspectClassName} w-24 shrink-0 items-center justify-center overflow-hidden rounded-control border border-dashed border-border bg-surface-muted`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="px-2 text-center text-[10px] text-text-muted">{emptyLabel}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <label
            htmlFor={fileName}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-3 py-2 text-body-sm text-text transition-colors hover:bg-surface-muted"
          >
            <ImagePlus className="size-4" aria-hidden />
            {preview ? "Replace image" : "Upload image"}
          </label>
          <input
            ref={inputRef}
            id={fileName}
            name={fileName}
            type="file"
            accept={COVER_MIME_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            aria-describedby={error ? `${fileName}-error` : `${fileName}-hint`}
            aria-invalid={error ? true : undefined}
          />
          <p id={`${fileName}-hint`} className="text-caption text-text-muted">
            {hint ?? `JPEG, PNG or WEBP · max ${maxMb} MB.`}
            {fileName_ ? ` Selected: ${fileName_}` : ""}
          </p>

          {error && (
            <p id={`${fileName}-error`} role="alert" className="text-caption text-error">
              {error}
            </p>
          )}

          {preview && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="size-4" aria-hidden />
              Remove image
            </Button>
          )}

          {!isManagedUpload && (
            <div>
              <label htmlFor={urlName} className="text-label mb-1 block text-text">
                {urlLabel}
              </label>
              <Input
                id={urlName}
                name={urlName}
                defaultValue={initialUrl}
                placeholder="/uploads/… or https://…"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
