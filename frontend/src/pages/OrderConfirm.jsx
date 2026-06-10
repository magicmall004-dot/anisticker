import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { formatPrice, statusColor, statusLabel } from "../lib/utils";
import { openTelegramLink } from "../lib/telegram";

export default function OrderConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  if (!order) {
    navigate("/");
    return null;
  }

  return (
    <div className="page" style={{ display:"flex", flexDirection:"column", minHeight:"100dvh" }}>
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"32px 24px",
        textAlign:"center",
        gap:16,
      }}>
        <div style={{
          width:72, height:72, borderRadius:"50%",
          background:"rgba(34,197,94,.15)", border:"2px solid var(--success)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <CheckCircle size={36} color="var(--success)" />
        </div>

        <div>
          <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Order Placed!</div>
          <div style={{ color:"var(--hint)", fontSize:14, lineHeight:1.6 }}>
            Your order has been submitted.<br/>
            The owner will review and accept it shortly.
          </div>
        </div>

        {/* Order details */}
        <div className="card" style={{ width:"100%", textAlign:"left", maxWidth:380 }}>
          <div className="row-between" style={{ marginBottom:8 }}>
            <span style={{ color:"var(--hint)", fontSize:13 }}>Order ID</span>
            <span style={{ fontFamily:"monospace", fontSize:13 }}>{order.id?.slice(0,8)}…</span>
          </div>
          <div className="row-between" style={{ marginBottom:8 }}>
            <span style={{ color:"var(--hint)", fontSize:13 }}>Status</span>
            <span style={{
              ...badgeStyle(statusColor(order.status)),
              fontSize:12, padding:"3px 10px", borderRadius:99,
            }}>
              {statusLabel(order.status)}
            </span>
          </div>
          <div className="divider" style={{ margin:"8px 0" }} />
          <div className="row-between">
            <span style={{ fontWeight:700 }}>Total Paid</span>
            <span style={{ fontWeight:700, color:"var(--accent2)", fontSize:16 }}>
              {formatPrice(order.total_price)}
            </span>
          </div>
        </div>

        <div style={{ color:"var(--hint)", fontSize:13, maxWidth:300 }}>
          Once your animated emoji pack is ready, you'll receive a notification in Telegram. 🎉
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:"16px 16px calc(32px + var(--safe-bottom))", display:"flex", flexDirection:"column", gap:10 }}>
        <button className="btn btn-primary btn-full" onClick={() => navigate("/")}>
          Back to Designs
        </button>
        <button className="btn btn-secondary btn-full" onClick={() => navigate("/orders")}>
          View My Orders
        </button>
      </div>
    </div>
  );
}

function badgeStyle(color) {
  return {
    background: color + "22",
    color:      color,
    border:     `1px solid ${color}44`,
    fontWeight: 600,
  };
}
