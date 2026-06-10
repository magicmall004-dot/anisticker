import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Package } from "lucide-react";
import { getOrders } from "../lib/api";
import { formatPrice, statusColor, statusLabel } from "../lib/utils";
import { showBackButton, hideBackButton } from "../lib/telegram";

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    getOrders().then(setOrders).finally(() => setLoading(false));
    return hideBackButton;
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">My Orders</div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <div style={{ fontWeight:600 }}>No orders yet</div>
            <div style={{ fontSize:13 }}>Your orders will appear here</div>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card">
              <div className="row-between" style={{ marginBottom:8 }}>
                <div style={{ fontFamily:"monospace", fontSize:13, color:"var(--hint)" }}>
                  #{order.id.slice(0,8)}
                </div>
                <span style={{
                  fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99,
                  background: statusColor(order.status) + "22",
                  color:      statusColor(order.status),
                  border:     `1px solid ${statusColor(order.status)}44`,
                }}>
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="row-between">
                <div style={{ fontSize:13, color:"var(--hint)" }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontWeight:700, color:"var(--accent2)" }}>
                  {formatPrice(order.total_price)}
                </div>
              </div>

              {order.status === "done" && (
                <div style={{
                  marginTop:10, padding:"8px 12px",
                  background:"rgba(34,197,94,.1)", borderRadius:"var(--radius-sm)",
                  color:"var(--success)", fontSize:13, fontWeight:600,
                  textAlign:"center",
                }}>
                  🎉 Your animated emoji pack is ready!
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
