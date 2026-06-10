import { signIn } from "../actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Admin
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Sign in</h1>

        {!isSupabaseConfigured() && (
          <p className="mt-6 rounded-md border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            Supabase is not configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your project credentials.
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <form action={signIn} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="h-10 rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="h-10 rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-ring"
            />
          </label>
          <button
            type="submit"
            className="mt-2 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
