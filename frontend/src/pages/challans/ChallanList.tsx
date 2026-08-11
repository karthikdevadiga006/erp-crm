import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../components/layout/Topbar";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { StatusPill } from "../../components/ui/StatusPill";
import { api, ApiRequestError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Challan, Paginated } from "../../lib/types";
import { ChallanForm } from "./ChallanForm";

export function ChallanList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === "ADMIN" || user?.role === "SALES";

  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await api.get<Paginated<Challan>>(`/challans?${params.toString()}`);
    setChallans(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleCreate(values: { customerId: string; items: { productId: string; quantity: number }[] }) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.post<{ data: Challan }>("/challans", values);
      setShowCreate(false);
      navigate(`/challans/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
        throw err;
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Sales Challans"
        actions={canWrite && <Button onClick={() => setShowCreate(true)}>New challan</Button>}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>

        <DataTable
          rows={challans}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          onRowClick={(c) => navigate(`/challans/${c.id}`)}
          emptyTitle="No challans found"
          emptyHint="Create a new challan to get started."
          columns={[
            { header: "Challan #", render: (c) => <span className="font-mono font-medium">{c.challanNumber}</span> },
            { header: "Customer", render: (c) => c.customer.name },
            { header: "Items", render: (c) => c.items.length },
            { header: "Total qty", render: (c) => <span className="font-mono">{c.totalQuantity}</span> },
            { header: "Status", render: (c) => <StatusPill status={c.status} /> },
            { header: "Created", render: (c) => new Date(c.createdAt).toLocaleDateString() },
          ]}
        />
      </main>

      {showCreate && (
        <Modal title="New sales challan" onClose={() => setShowCreate(false)} wide>
          {formError && <p className="mb-3 rounded-md bg-rose-bg px-3 py-2 text-sm text-rose">{formError}</p>}
          <ChallanForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} isSubmitting={isSubmitting} />
        </Modal>
      )}
    </>
  );
}
