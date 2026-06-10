import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Layers, CreditCard, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import OwnerOrders   from "./OwnerOrders";
import OwnerDesigns  from "./OwnerDesigns";
import OwnerPayments from "./OwnerPayments";
import OwnerUsers    from "./OwnerUsers";

const TABS = [
  { id:"orders",   label:"Orders",   Icon:Package    },
  { id:"designs",  label:"Designs",  Icon:Layers     },
  { id:"payments", label:"Payments", Icon:CreditCard },
  { id:"users",    label:"Users",    Icon:Users      },
];

export default function OwnerDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");

  if (user?.role !== "owner") {
    navigate("/");
    return null;
  }

  return (
    <div className="page" style={{ paddingBottom:"calc(64px + var(--safe-bottom))" }}>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate("/")}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">Owner Panel</div>
      </div>

      {/* Tab content */}
      <div style={{ paddingBottom:0 }}>
        {tab === "orders"   && <OwnerOrders />}
        {tab === "designs"  && <OwnerDesigns />}
        {tab === "payments" && <OwnerPayments />}
        {tab === "users"    && <OwnerUsers />}
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <div key={id} className={`tab-item ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}>
            <Icon size={20} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
