import { FormEvent, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Input";
import { MovementType, Product } from "../../lib/types";

export function StockAdjustForm({
  product,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  product: Product;
  onSubmit: (values: { quantity: number; movementType: MovementType; reason: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<MovementType>("IN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({ quantity: Number(quantity), movementType, reason });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not adjust stock.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate">
        Current stock for <span className="font-mono text-ink">{product.sku}</span>:{" "}
        <span className="font-mono font-medium text-ink">{product.currentStock}</span>
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Movement" htmlFor="movementType">
          <Select id="movementType" value={movementType} onChange={(e) => setMovementType(e.target.value as MovementType)}>
            <option value="IN">Stock in (received)</option>
            <option value="OUT">Stock out (removed)</option>
          </Select>
        </Field>
        <Field label="Quantity" htmlFor="quantity">
          <Input
            id="quantity"
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Reason" htmlFor="reason">
        <Input
          id="reason"
          required
          placeholder="e.g. Purchase order received, stock count correction"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      {error && <p className="rounded-md bg-rose-bg px-3 py-2 text-sm text-rose">{error}</p>}
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Apply adjustment"}
        </Button>
      </div>
    </form>
  );
}
