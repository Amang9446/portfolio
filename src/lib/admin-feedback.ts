export const adminNoticeMessages = {
  "password-updated": "Password updated.",
  "post-created": "Post created.",
  "post-updated": "Post updated.",
  "post-published": "Post published.",
  "post-unpublished": "Post moved to drafts.",
  "post-added-home": "Post added to the home page.",
  "post-removed-home": "Post removed from the home page.",
  "post-deleted": "Post deleted.",
  "sections-saved": "Section visibility saved.",
  "hero-saved": "Hero content saved.",
  "skills-saved": "Skills saved.",
  "contact-saved": "Contact details saved.",
  "metadata-saved": "SEO metadata saved.",
  "project-created": "Project created.",
  "project-updated": "Project updated.",
  "project-shown": "Project is now visible.",
  "project-hidden": "Project hidden from the home page.",
  "project-deleted": "Project deleted.",
} as const;

export type AdminNotice = keyof typeof adminNoticeMessages;

export const adminErrorMessages = {
  "invalid-login": "Invalid email or password.",
  unauthorized: "This account does not have admin access.",
  "password-short": "Password must be at least 12 characters.",
  "password-mismatch": "Passwords do not match.",
  "current-password-incorrect": "Current password is incorrect.",
  "password-update-failed": "Failed to update password. Please try again.",
  "post-required-fields": "Title and slug are required.",
  "post-not-found": "Post not found.",
  "post-save-failed": "Failed to save post. Please check the logs.",
  "post-delete-failed": "Failed to delete post.",
  "post-missing-id": "Missing post ID.",
  "project-required-fields": "Title is required.",
  "project-save-failed": "Failed to save project. Please check the logs.",
  "project-delete-failed": "Failed to delete project.",
  "project-missing-id": "Missing project ID.",
  "content-save-failed": "Failed to save site content.",
  "generic-error": "An unexpected error occurred. Please try again.",
} as const;

export type AdminErrorCode = keyof typeof adminErrorMessages;

export function adminNoticeUrl(path: string, notice: AdminNotice) {
  return `${path}?notice=${notice}`;
}

export function adminErrorUrl(path: string, error: AdminErrorCode) {
  return `${path}?error=${encodeURIComponent(error)}`;
}

export function resolveAdminErrorMessage(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  return (
    adminErrorMessages[code as AdminErrorCode] ??
    adminErrorMessages["generic-error"]
  );
}
