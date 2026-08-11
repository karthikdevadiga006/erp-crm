import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, ApiRequestError } from "../lib/auth-context";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Input";

export function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-indigo px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-semibold tracking-tight text-white">Ledger</div>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-white/50">
            Operations Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-card">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p className="rounded-md bg-rose-bg px-3 py-2 text-sm text-rose" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center font-mono text-[11px] text-white/40">
          Seeded logins: admin / sales / warehouse / accounts @wholesaleco.test
        </p>
      </div>
    </div>
  );
}
