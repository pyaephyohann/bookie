import { AlertCircle, CheckCircle } from "lucide-react";

/**
 * Maps safe status codes (never raw DB errors) to user-facing messages.
 * Server actions redirect with `?status=<code>`; nothing internal leaks.
 */
const MESSAGES: Record<string, { tone: "success" | "error"; text: string }> = {
  created: { tone: "success", text: "Created successfully." },
  updated: { tone: "success", text: "Changes saved successfully." },
  archived: { tone: "success", text: "Archived. The item is no longer published." },
  restored: { tone: "success", text: "Restored to draft." },
  deleted: { tone: "success", text: "Deleted successfully." },
  activated: { tone: "success", text: "User activated." },
  deactivated: { tone: "success", text: "User deactivated." },
  "password-reset": { tone: "success", text: "Password has been reset." },
  "self-deactivate": {
    tone: "error",
    text: "You cannot deactivate your own account.",
  },
  "last-admin": {
    tone: "error",
    text: "Cannot deactivate the only active administrator.",
  },
  "permission-denied": {
    tone: "error",
    text: "Only administrators can perform this action.",
  },
  duplicate: { tone: "error", text: "That book is already assigned to this featured shelf." },
  renamed: { tone: "success", text: "Publisher renamed across all books." },
  cleared: { tone: "success", text: "Publisher cleared from all books." },
  "in-use": {
    tone: "error",
    text: "This book is referenced by orders or inventory history, so it cannot be deleted. Archive it instead.",
  },
  "has-books": {
    tone: "error",
    text: "This item still has books linked to it. Reassign those books first.",
  },
  "has-children": {
    tone: "error",
    text: "This category still has sub-categories. Remove those first.",
  },
  "not-found": { tone: "error", text: "That item no longer exists." },
  "slug-taken": {
    tone: "error",
    text: "That slug is already used by another item. Choose a different one.",
  },
  invalid: { tone: "error", text: "The submitted data was not valid. Please review and try again." },
  failed: { tone: "error", text: "Something went wrong. Please try again." },
};

export function AdminFeedback({ code }: { code?: string }) {
  if (!code) return null;
  const message = MESSAGES[code];
  if (!message) return null;

  const isSuccess = message.tone === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`mb-5 flex items-start gap-2 rounded-control border px-3 py-2.5 text-body-sm ${
        isSuccess
          ? "border-success/30 bg-success-muted text-success"
          : "border-error/30 bg-error-muted text-error"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <span>{message.text}</span>
    </div>
  );
}
