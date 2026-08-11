export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";
export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type MovementType = "IN" | "OUT";

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string | null;
  status: CustomerStatus;
  followUpDate: string | null;
  createdAt: string;
  createdBy?: { name: string };
  followUps?: FollowUpNote[];
  challans?: { id: string; challanNumber: string; status: ChallanStatus; totalQuantity: number; createdAt: string }[];
}

export interface FollowUpNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy?: { name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: number;
  minStockAlert: number;
  location: string | null;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  timestamp: string;
  createdBy?: { name: string };
}

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  product?: { id: string; name: string; sku: string };
}

export interface Challan {
  id: string;
  challanNumber: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdAt: string;
  customer: { id: string; name: string; businessName: string | null };
  createdBy?: { name: string };
  items: ChallanItem[];
}
