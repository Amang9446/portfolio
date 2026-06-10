import { changePassword } from "../../actions";

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function AccountPage({ searchParams }: PageProps) {
  const { error, success } = await searchParams;

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold">Account</h1>

      {error && (
        <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-6 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">
          Password updated.
        </p>
      )}

      <form action={changePassword} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">New password</span>
          <input
            type="password"
            name="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="h-10 rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Confirm new password</span>
          <input
            type="password"
            name="confirm"
            required
            minLength={12}
            autoComplete="new-password"
            className="h-10 rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-ring"
          />
        </label>
        <button
          type="submit"
          className="mt-2 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
