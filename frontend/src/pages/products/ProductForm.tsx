import { FormEvent, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { Product } from "../../lib/types";

export interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  minStockAlert: string;
  location: string;
}

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    category: initial?.category ?? "",
    unitPrice: initial?.unitPrice ?? "",
    minStockAlert: initial ? String(initial.minStockAlert) : "0",
    location: initial?.location ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Product name" htmlFor="name">
          <Input id="name" required value={values.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="SKU / code" htmlFor="sku">
          <Input
            id="sku"
            required
            disabled={!!initial}
            value={values.sku}
            onChange={(e) => set("sku", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Category" htmlFor="category">
          <Input id="category" required value={values.category} onChange={(e) => set("category", e.target.value)} />
        </Field>
        <Field label="Unit price" htmlFor="unitPrice">
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0"
            required
            value={values.unitPrice}
            onChange={(e) => set("unitPrice", e.target.value)}
          />
        </Field>
        <Field label="Min stock alert" htmlFor="minStockAlert">
          <Input
            id="minStockAlert"
            type="number"
            min="0"
            value={values.minStockAlert}
            onChange={(e) => set("minStockAlert", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Location / warehouse" htmlFor="location">
        <Input id="location" value={values.location} onChange={(e) => set("location", e.target.value)} />
      </Field>

      {error && <p className="rounded-md bg-rose-bg px-3 py-2 text-sm text-rose">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save product"}
        </Button>
      </div>
    </form>
  );
}
