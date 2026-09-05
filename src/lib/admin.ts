// Server-only admin allowlist, mirroring the admin_emails table in Supabase.
// RLS is the hard boundary; this check just keeps non-admins out of the
// admin UI entirely.
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Fail closed when ADMIN_EMAILS is unset. RLS still blocks every write, but
  // Supabase signups are public by default, so failing open would hand the
  // admin shell to anyone who registers on a deployment that forgot the var.
  // Locked out? Set ADMIN_EMAILS — never widen this.
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase());
}
