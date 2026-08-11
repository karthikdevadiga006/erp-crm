import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../../components/layout/Topbar";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { StatusPill } from "../../components/ui/StatusPill";
import { Textarea } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Customer } from "../../lib/types";
import { CustomerForm, CustomerFormValues } from "./CustomerForm";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "SALES";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  async function load() {
    setIsLoading(true);
    const res = await api.get<{ data: Customer }>(`/customers/${id}`);
    setCustomer(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(values: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      await api.put(`/customers/${id}`, { ...values, email: values.email || undefined });
      setShowEdit(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setIsAddingNote(true);
    try {
      await api.post(`/customers/${id}/followups`, { note });
      setNote("");
      load();
    } finally {
      setIsAddingNote(false);
    }
  }

  if (isLoading || !customer) {
    return (
      <>
        <Topbar title="Customer" />
        <main className="flex-1 p-6 text-sm text-slate">Loading…</main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={customer.name}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/customers")}>
              Back
            </Button>
            {canWrite && <Button onClick={() => setShowEdit(true)}>Edit</Button>}
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-4">
          <section className="col-span-2 rounded-lg border border-line bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <StatusPill status={customer.status} />
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate">
                {customer.customerType}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate">Business</dt>
                <dd className="text-ink">{customer.businessName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Mobile</dt>
                <dd className="font-mono text-ink">{customer.mobile}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Email</dt>
                <dd className="text-ink">{customer.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate">GST number</dt>
                <dd className="font-mono text-ink">{customer.gstNumber || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate">Address</dt>
                <dd className="text-ink">{customer.address || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-sm font-semibold text-ink">Challans</h2>
            <ul className="flex flex-col gap-2">
              {(customer.challans ?? []).length === 0 && (
                <li className="text-sm text-slate">No challans yet.</li>
              )}
              {customer.challans?.map((c) => (
                <li
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between rounded border border-line px-3 py-2 text-sm hover:bg-paper"
                  onClick={() => navigate(`/challans/${c.id}`)}
                >
                  <span className="font-mono text-xs">{c.challanNumber}</span>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-line bg-white p-5 shadow-card">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Follow-up notes</h2>
          {canWrite && (
            <form onSubmit={handleAddNote} className="mb-4 flex gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log a call, visit, or update…"
                className="min-h-[42px] flex-1"
              />
              <Button type="submit" disabled={isAddingNote}>
                Add
              </Button>
            </form>
          )}
          <ul className="flex flex-col gap-3">
            {(customer.followUps ?? []).length === 0 && (
              <li className="text-sm text-slate">No follow-up notes yet.</li>
            )}
            {customer.followUps?.map((f) => (
              <li key={f.id} className="border-l-2 border-line pl-3">
                <p className="text-sm text-ink">{f.note}</p>
                <p className="mt-0.5 text-xs text-slate">
                  {f.createdBy?.name} · {new Date(f.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {showEdit && (
        <Modal title="Edit customer" onClose={() => setShowEdit(false)} wide>
          <CustomerForm
            initial={customer}
            onSubmit={handleUpdate}
            onCancel={() => setShowEdit(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </>
  );
}
