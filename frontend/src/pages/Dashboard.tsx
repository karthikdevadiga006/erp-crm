import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "../components/layout/Topbar";
import { StatusPill } from "../components/ui/StatusPill";
import { api } from "../lib/api";
import { Paginated, Product, Challan, Customer } from "../lib/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-card">
      <div className="font-mono text-[11px] uppercase tracking-wider text-slate">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export function Dashboard() {
  const [counts, setCounts] = useState<{ customers?: number; products?: number; challans?: number }>({});
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [leadCustomers, setLeadCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api.get<Paginated<Customer>>("/customers?limit=1").then((r) =>
      setCounts((c) => ({ ...c, customers: r.pagination.total }))
    );
    api.get<Paginated<Product>>("/products?limit=1").then((r) =>
      setCounts((c) => ({ ...c, products: r.pagination.total }))
    );
    api.get<Paginated<Challan>>("/challans?limit=1").then((r) =>
      setCounts((c) => ({ ...c, challans: r.pagination.total }))
    );
    api.get<Paginated<Product>>("/products?lowStock=true&limit=5").then((r) => setLowStock(r.data));
    api.get<Paginated<Challan>>("/challans?limit=5").then((r) => setRecentChallans(r.data));
    api.get<Paginated<Customer>>("/customers?status=LEAD&limit=5").then((r) => setLeadCustomers(r.data));
  }, []);

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Customers" value={counts.customers ?? "—"} />
          <StatCard label="Products" value={counts.products ?? "—"} />
          <StatCard label="Challans" value={counts.challans ?? "—"} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <section className="rounded-lg border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-sm font-semibold text-ink">Low stock</h2>
              <Link to="/products" className="text-xs font-medium text-indigo hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {lowStock.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate">Nothing below the alert threshold.</li>
              )}
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="font-mono text-xs text-slate">{p.sku}</div>
                  </div>
                  <div className="font-mono text-sm text-amber">
                    {p.currentStock} / {p.minStockAlert}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-sm font-semibold text-ink">Recent challans</h2>
              <Link to="/challans" className="text-xs font-medium text-indigo hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {recentChallans.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-slate">No challans yet.</li>
              )}
              {recentChallans.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-mono font-medium text-ink">{c.challanNumber}</div>
                    <div className="text-xs text-slate">{c.customer.name}</div>
                  </div>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="font-display text-sm font-semibold text-ink">Leads awaiting follow-up</h2>
            <Link to="/customers" className="text-xs font-medium text-indigo hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {leadCustomers.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate">No open leads.</li>
            )}
            {leadCustomers.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="font-medium text-ink">{c.name}</div>
                <div className="text-xs text-slate">{c.mobile}</div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
