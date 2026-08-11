import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./lib/auth-context";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CustomerList } from "./pages/customers/CustomerList";
import { CustomerDetail } from "./pages/customers/CustomerDetail";
import { ProductList } from "./pages/products/ProductList";
import { ChallanList } from "./pages/challans/ChallanList";
import { ChallanDetail } from "./pages/challans/ChallanDetail";

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/challans" element={<ChallanList />} />
        <Route path="/challans/:id" element={<ChallanDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
