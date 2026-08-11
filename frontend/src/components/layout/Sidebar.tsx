import { NavLink } from "react-router-dom";
import { Role } from "../../lib/auth-context";

interface NavItem {
  to: string;
  label: string;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/products", label: "Products" },
  { to: "/challans", label: "Challans" },
];

export function Sidebar({ role }: { role: Role }) {
  const visible = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col bg-indigo text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="font-display text-lg font-semibold tracking-tight">Ledger</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-5 py-4 font-mono text-[11px] text-white/40">
        Wholesale Ops Portal
      </div>
    </aside>
  );
}
