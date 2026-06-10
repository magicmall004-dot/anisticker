import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider } from "./components/Toast";

import DesignList     from "./pages/DesignList";
import DesignSetup    from "./pages/DesignSetup";
import Payment        from "./pages/Payment";
import OrderConfirm   from "./pages/OrderConfirm";
import MyOrders       from "./pages/MyOrders";
import OwnerDashboard from "./pages/OwnerDashboard";

function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, authReady } = useApp();

  if (!authReady) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div style={{ color:"var(--hint)", fontSize:14 }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize:32 }}>✨</div>
        <div style={{ fontWeight:700, fontSize:18 }}>AniSticker</div>
        <div style={{ color:"var(--hint)", fontSize:14, textAlign:"center", maxWidth:260 }}>
          Please open this app through Telegram to continue.
        </div>
      </div>
    );
  }

  if (ownerOnly && user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  // Read ?page= query for deep-linking from bot notifications
  const params = new URLSearchParams(window.location.search);
  const deepPage = params.get("page");

  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          {deepPage === "orders" ? <Navigate to="/orders" replace /> : <DesignList />}
        </ProtectedRoute>
      } />
      <Route path="/setup" element={<ProtectedRoute><DesignSetup /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/order-confirm" element={<ProtectedRoute><OrderConfirm /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/owner" element={<ProtectedRoute ownerOnly><OwnerDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL; // "/anisticker/" in prod

  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter basename={base}>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
