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

export function adminNoticeUrl(path: string, notice: AdminNotice) {
  return `${path}?notice=${notice}`;
}

export function adminErrorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}
