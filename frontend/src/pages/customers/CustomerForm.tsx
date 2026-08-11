import { FormEvent, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { Customer, CustomerStatus, CustomerType } from "../../lib/types";

export interface CustomerFormValues {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
}

export function CustomerForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Customer;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [values, setValues] = useState<CustomerFormValues>({
    name: initial?.name ?? "",
    mobile: initial?.mobile ?? "",
    email: initial?.email ?? "",
    businessName: initial?.businessName ?? "",
    gstNumber: initial?.gstNumber ?? "",
    customerType: initial?.customerType ?? "WHOLESALE",
    address: initial?.address ?? "",
    status: initial?.status ?? "LEAD",
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save customer.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer name" htmlFor="name">
          <Input id="name" required value={values.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Mobile" htmlFor="mobile">
          <Input id="mobile" required value={values.mobile} onChange={(e) => set("mobile", e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Business name" htmlFor="businessName">
          <Input
            id="businessName"
            value={values.businessName}
            onChange={(e) => set("businessName", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="GST number" htmlFor="gstNumber">
          <Input id="gstNumber" value={values.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} />
        </Field>
        <Field label="Customer type" htmlFor="customerType">
          <Select
            id="customerType"
            value={values.customerType}
            onChange={(e) => set("customerType", e.target.value as CustomerType)}
          >
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" value={values.status} onChange={(e) => set("status", e.target.value as CustomerStatus)}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
      </div>

      <Field label="Address" htmlFor="address">
        <Textarea id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
      </Field>

      {error && <p className="rounded-md bg-rose-bg px-3 py-2 text-sm text-rose">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save customer"}
        </Button>
      </div>
    </form>
  );
}
