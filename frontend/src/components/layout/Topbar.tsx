import { ReactNode } from "react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/Button";

export function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
      <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-4">
        {actions}
        <div className="flex items-center gap-3 border-l border-line pl-4">
          <div className="text-right">
            <div className="text-sm font-medium leading-tight text-ink">{user?.name}</div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate">{user?.role}</div>
          </div>
          <Button variant="ghost" onClick={logout} className="text-xs">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
