import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../components/layout/Topbar";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Input, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { StatusPill } from "../../components/ui/StatusPill";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Customer, Paginated } from "../../lib/types";
import { CustomerForm, CustomerFormValues } from "./CustomerForm";

export function CustomerList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === "ADMIN" || user?.role === "SALES";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await api.get<Paginated<Customer>>(`/customers?${params.toString()}`);
    setCustomers(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  async function handleCreate(values: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      await api.post("/customers", { ...values, email: values.email || undefined });
      setShowCreate(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Customers"
        actions={canWrite && <Button onClick={() => setShowCreate(true)}>Add customer</Button>}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex gap-3">
          <Input
            placeholder="Search by name, mobile, business…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[160px]">
            <option value="">All statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>

        <DataTable
          rows={customers}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          emptyTitle="No customers found"
          emptyHint="Try a different search or add a new customer."
          columns={[
            { header: "Name", render: (c) => <span className="font-medium text-ink">{c.name}</span> },
            { header: "Business", render: (c) => c.businessName || "—" },
            { header: "Mobile", render: (c) => <span className="font-mono text-xs">{c.mobile}</span> },
            { header: "Type", render: (c) => c.customerType },
            { header: "Status", render: (c) => <StatusPill status={c.status} /> },
          ]}
        />
      </main>

      {showCreate && (
        <Modal title="Add customer" onClose={() => setShowCreate(false)} wide>
          <CustomerForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} isSubmitting={isSubmitting} />
        </Modal>
      )}
    </>
  );
}
