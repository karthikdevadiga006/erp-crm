import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { Customer, Paginated, Product } from "../../lib/types";

interface LineItem {
  productId: string;
  quantity: string;
}

export function ChallanForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (values: { customerId: string; items: { productId: string; quantity: number }[] }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Paginated<Customer>>("/customers?limit=100").then((r) => setCustomers(r.data));
    api.get<Paginated<Product>>("/products?limit=200").then((r) => setProducts(r.data));
  }, []);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addRow() {
    setItems((prev) => [...prev, { productId: "", quantity: "1" }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function productStock(productId: string) {
    return products.find((p) => p.id === productId)?.currentStock;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanItems = items
      .filter((it) => it.productId && Number(it.quantity) > 0)
      .map((it) => ({ productId: it.productId, quantity: Number(it.quantity) }));

    if (!customerId) {
      setError("Select a customer.");
      return;
    }
    if (cleanItems.length === 0) {
      setError("Add at least one product with a quantity.");
      return;
    }

    try {
      await onSubmit({ customerId, items: cleanItems });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create challan.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Customer" htmlFor="customerId">
        <Select id="customerId" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.businessName ? `— ${c.businessName}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <div className="mb-2 text-sm font-medium text-ink">Products</div>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  value={item.productId}
                  onChange={(e) => updateItem(index, { productId: e.target.value })}
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.currentStock} in stock
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  placeholder="Qty"
                />
              </div>
              <Button type="button" variant="ghost" onClick={() => removeRow(index)} disabled={items.length === 1}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        {items.some((it) => it.productId && Number(it.quantity) > (productStock(it.productId) ?? Infinity)) && (
          <p className="mt-2 text-xs text-amber">
            One or more quantities exceed current stock — confirming will fail until stock is sufficient.
          </p>
        )}
        <Button type="button" variant="secondary" onClick={addRow} className="mt-2 text-xs">
          + Add product
        </Button>
      </div>

      {error && <p className="rounded-md bg-rose-bg px-3 py-2 text-sm text-rose">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save as draft"}
        </Button>
      </div>
    </form>
  );
}
