// Server-only admin allowlist, mirroring the admin_emails table in Supabase.
// RLS is the hard boundary; this check just keeps non-admins out of the
// admin UI entirely.
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Fail open to the DB layer if the env var is unset: RLS still blocks writes.
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.toLowerCase());
}
