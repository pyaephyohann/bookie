"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { FileUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { READING_CONTENT_MAX_BYTES, type ContentActionState, type ReadingMode } from "@/lib/admin/content";

const READING_FILE_MAX_MB = 50;

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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setUploadFile(null);
      setUploadPreview(null);
      setUploadError(null);
      return;
    }

    // Validate file size
    if (file.size > READING_FILE_MAX_MB * 1024 * 1024) {
      setUploadError(`File must be ${READING_FILE_MAX_MB} MB or smaller.`);
      setUploadFile(null);
      setUploadPreview(null);
      return;
    }

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (mode === "PDF" && ext !== "pdf") {
      setUploadError("File must be a .pdf file.");
      setUploadFile(null);
      setUploadPreview(null);
      return;
    }
    if (mode === "EPUB" && ext !== "epub") {
      setUploadError("File must be a .epub file.");
      setUploadFile(null);
      setUploadPreview(null);
      return;
    }

    setUploadError(null);
    setUploadFile(file);
    setUploadPreview(file.name);
  };

  const handleFileRemove = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          <div className="mt-5 space-y-4">
            {/* File Upload */}
            <div>
              <label className="mb-1 block text-label text-text">Upload {mode} file</label>
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-control border border-dashed border-border bg-surface-muted">
                  {uploadPreview ? (
                    <span className="px-2 text-center text-[10px] text-text-muted">{uploadPreview}</span>
                  ) : (
                    <FileUp className="size-6 text-text-muted" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <label
                    htmlFor="readingFile"
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-3 py-2 text-body-sm text-text transition-colors hover:bg-surface-muted"
                  >
                    <FileUp className="size-4" aria-hidden />
                    {uploadPreview ? "Replace file" : `Upload ${mode} file`}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="readingFile"
                    name="readingFile"
                    type="file"
                    accept={mode === "PDF" ? ".pdf,application/pdf" : ".epub,application/epub+zip"}
                    className="sr-only"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    aria-describedby={uploadError ? "readingFile-error" : "readingFile-hint"}
                    aria-invalid={uploadError ? true : undefined}
                  />
                  <p id="readingFile-hint" className="text-caption text-text-muted">
                    {mode} file · max {READING_FILE_MAX_MB} MB
                    {uploadPreview ? ` · Selected: ${uploadPreview}` : ""}
                  </p>
                  {uploadError && (
                    <p id="readingFile-error" role="alert" className="text-caption text-error">
                      {uploadError}
                    </p>
                  )}
                  {uploadPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleFileRemove}>
                      <Trash2 className="size-4" aria-hidden />
                      Remove file
                    </Button>
                  )}
                </div>
              </div>
              <input type="hidden" name="readingFileData" value={uploadFile ? "uploaded" : ""} />
            </div>

            {/* Manual URL fallback */}
            <div>
              <Field label={`Or enter ${mode} file URL`} htmlFor="fileUrl" error={errors.fileUrl} hint="Use a root-relative public path or an HTTP(S) URL.">
                <Input id="fileUrl" name="fileUrl" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} aria-invalid={Boolean(errors.fileUrl)} aria-describedby={errors.fileUrl ? "fileUrl-error" : undefined} placeholder="/reading/example.pdf" />
              </Field>
            </div>
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
