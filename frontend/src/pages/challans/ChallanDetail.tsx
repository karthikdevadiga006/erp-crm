import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../../components/layout/Topbar";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import { api, ApiRequestError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Challan } from "../../lib/types";

interface Shortfall {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

export function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "SALES";

  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortfalls, setShortfalls] = useState<Shortfall[] | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await api.get<{ data: Challan }>(`/challans/${id}`);
    setChallan(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    setIsActing(true);
    setError(null);
    setShortfalls(null);
    try {
      await api.post(`/challans/${id}/confirm`);
      load();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        if (err.status === 409 && (err.details as any)?.items) {
          setShortfalls((err.details as any).items);
        }
      } else {
        setError("Could not confirm challan.");
      }
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    setIsActing(true);
    setError(null);
    try {
      await api.post(`/challans/${id}/cancel`);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not cancel challan.");
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading || !challan) {
    return (
      <>
        <Topbar title="Challan" />
        <main className="flex-1 p-6 text-sm text-slate">Loading…</main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={challan.challanNumber}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/challans")}>
              Back
            </Button>
            {canWrite && challan.status === "DRAFT" && (
              <Button onClick={handleConfirm} disabled={isActing}>
                {isActing ? "Confirming…" : "Confirm challan"}
              </Button>
            )}
            {canWrite && challan.status !== "CANCELLED" && (
              <Button variant="danger" onClick={handleCancel} disabled={isActing}>
                Cancel
              </Button>
            )}
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-3">
          <StatusPill status={challan.status} />
          <span className="text-sm text-slate">
            {challan.customer.name}
            {challan.customer.businessName ? ` — ${challan.customer.businessName}` : ""}
          </span>
          <span className="ml-auto text-xs text-slate">
            Created {new Date(challan.createdAt).toLocaleString()} by {challan.createdBy?.name}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-rose-bg px-4 py-3 text-sm text-rose">
            <p className="font-medium">{error}</p>
            {shortfalls && (
              <ul className="mt-2 list-disc pl-5">
                {shortfalls.map((s) => (
                  <li key={s.productId} className="font-mono text-xs">
                    {s.productName}: requested {s.requested}, only {s.available} available
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper">
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-slate">Product</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-slate">SKU</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-slate">
                  Unit price (at time of challan)
                </th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-slate">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{item.productNameSnapshot}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.skuSnapshot}</td>
                  <td className="px-4 py-3 font-mono">₹{item.unitPriceSnapshot}</td>
                  <td className="px-4 py-3 font-mono">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-paper">
                <td colSpan={3} className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate">
                  Total quantity
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-ink">{challan.totalQuantity}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate">
          Product name, SKU, and price are captured at the time the challan is created, so this record stays
          accurate even if the product is edited later.
        </p>
      </main>
    </>
  );
}
