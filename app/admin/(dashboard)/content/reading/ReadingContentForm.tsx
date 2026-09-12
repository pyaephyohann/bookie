"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { READING_CONTENT_MAX_BYTES, type ContentActionState, type ReadingMode } from "@/lib/admin/content";

interface ReadingContentFormProps {
  bookId: string;
  action: (previous: ContentActionState, formData: FormData) => Promise<ContentActionState>;
  initial: {
    mode: ReadingMode;
    content: string;
    fileUrl: string;
    isReadableOnline: boolean;
  };
}

function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-label text-text">{label}</label>
      {children}
      {error ? <p id={`${htmlFor}-error`} className="mt-1 text-caption text-error">{error}</p> : hint ? <p className="mt-1 text-caption text-text-muted">{hint}</p> : null}
    </div>
  );
}

export function ReadingContentForm({ bookId, action, initial }: ReadingContentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [mode, setMode] = useState<ReadingMode>(initial.mode);
  const [content, setContent] = useState(initial.content);
  const [fileUrl, setFileUrl] = useState(initial.fileUrl);
  const [isReadableOnline, setIsReadableOnline] = useState(initial.isReadableOnline);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="mode" value={mode} />
      {state.error && <div role="alert" className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error">{state.error}</div>}

      <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Content format" htmlFor="reading-mode" error={errors.mode} hint="Inline uses the existing content field; file formats use fileUrl.">
            <Select id="reading-mode" value={mode} onChange={(event) => setMode(event.target.value as ReadingMode)} aria-invalid={Boolean(errors.mode)}>
              <option value="INLINE">Inline HTML or plain text</option>
              <option value="PDF">PDF file</option>
              <option value="EPUB">EPUB file</option>
              <option value="OTHER">Other file</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-text">
              <input type="checkbox" name="isReadableOnline" checked={isReadableOnline} onChange={(event) => setIsReadableOnline(event.target.checked)} className="size-4 accent-[var(--color-ink)]" />
              Enable Read Online on the storefront
            </label>
          </div>
        </div>

        {mode === "INLINE" ? (
          <div className="mt-5">
            <Field label="Inline content *" htmlFor="content" error={errors.content} hint={`Safe HTML is sanitized on the server. Plain text keeps line breaks. Maximum ${Math.floor(READING_CONTENT_MAX_BYTES / 1024 / 1024)} MB.`}>
              <Textarea id="content" name="content" rows={18} value={content} onChange={(event) => setContent(event.target.value)} aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? "content-error" : undefined} placeholder="Paste a chapter, formatted HTML, or plain text…" />
            </Field>
            <input type="hidden" name="fileUrl" value="" />
          </div>
        ) : (
          <div className="mt-5">
            <Field label={`${mode} file URL *`} htmlFor="fileUrl" error={errors.fileUrl} hint="Use a root-relative public path or an HTTP(S) URL. A7 does not upload files.">
              <Input id="fileUrl" name="fileUrl" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} aria-invalid={Boolean(errors.fileUrl)} aria-describedby={errors.fileUrl ? "fileUrl-error" : undefined} placeholder="/reading/example.pdf" />
            </Field>
            <input type="hidden" name="content" value="" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={pending} disabled={pending}>
          <Save className="size-4" aria-hidden />
          Save reading content
        </Button>
        <span className="text-caption text-text-muted">The storefront reader will use the existing B9 representation.</span>
      </div>
    </form>
  );
}
