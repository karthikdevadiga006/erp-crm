import { Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
