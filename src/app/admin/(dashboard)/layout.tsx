import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminEmail } from "@/lib/admin";
import { signOut } from "../actions";
import AdminFeedback from "@/components/admin/admin-feedback";

export const metadata = {
  title: "Admin | Aman",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={null}>
        <AdminFeedback />
      </Suspense>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-7 text-sm">
            <Link
              href="/admin"
              className="font-display font-semibold tracking-tight"
            >
              Admin
              <span className="text-primary">.</span>
            </Link>
            <Link
              href="/admin/posts"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Posts
            </Link>
            <Link
              href="/admin/projects"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Projects
            </Link>
            <Link
              href="/admin/content"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Site
            </Link>
            <Link
              href="/admin/account"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Account
            </Link>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              View site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
