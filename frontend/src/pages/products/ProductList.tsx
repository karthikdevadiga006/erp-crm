import { useEffect, useState } from "react";
import { Topbar } from "../../components/layout/Topbar";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Input, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { MovementType, Paginated, Product } from "../../lib/types";
import { ProductForm, ProductFormValues } from "./ProductForm";
import { StockAdjustForm } from "./StockAdjustForm";

export function ProductList() {
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "WAREHOUSE";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (lowStockOnly) params.set("lowStock", "true");
    const res = await api.get<Paginated<Product>>(`/products?${params.toString()}`);
    setProducts(res.data);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly]);

  async function handleCreate(values: ProductFormValues) {
    setIsSubmitting(true);
    try {
      await api.post("/products", values);
      setShowCreate(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdjust(values: { quantity: number; movementType: MovementType; reason: string }) {
    if (!adjustTarget) return;
    setIsSubmitting(true);
    try {
      await api.post(`/products/${adjustTarget.id}/stock-adjust`, values);
      setAdjustTarget(null);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Products"
        actions={canWrite && <Button onClick={() => setShowCreate(true)}>Add product</Button>}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-3">
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={lowStockOnly ? "low" : ""}
            onChange={(e) => setLowStockOnly(e.target.value === "low")}
            className="max-w-[180px]"
          >
            <option value="">All products</option>
            <option value="low">Low stock only</option>
          </Select>
        </div>

        <DataTable
          rows={products}
          isLoading={isLoading}
          rowKey={(p) => p.id}
          emptyTitle="No products found"
          emptyHint="Try a different search or add a new product."
          columns={[
            {
              header: "Product",
              render: (p) => (
                <div>
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="font-mono text-xs text-slate">{p.sku}</div>
                </div>
              ),
            },
            { header: "Category", render: (p) => p.category },
            { header: "Unit price", render: (p) => <span className="font-mono">₹{p.unitPrice}</span> },
            {
              header: "Stock",
              render: (p) => (
                <span className={`font-mono ${p.currentStock <= p.minStockAlert ? "text-amber" : "text-ink"}`}>
                  {p.currentStock} <span className="text-slate">/ {p.minStockAlert} min</span>
                </span>
              ),
            },
            { header: "Location", render: (p) => p.location || "—" },
            {
              header: "",
              render: (p) =>
                canWrite && (
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdjustTarget(p);
                    }}
                  >
                    Adjust stock
                  </Button>
                ),
            },
          ]}
        />
      </main>

      {showCreate && (
        <Modal title="Add product" onClose={() => setShowCreate(false)} wide>
          <ProductForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} isSubmitting={isSubmitting} />
        </Modal>
      )}

      {adjustTarget && (
        <Modal title={`Adjust stock — ${adjustTarget.name}`} onClose={() => setAdjustTarget(null)}>
          <StockAdjustForm
            product={adjustTarget}
            onSubmit={handleAdjust}
            onCancel={() => setAdjustTarget(null)}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </>
  );
}
