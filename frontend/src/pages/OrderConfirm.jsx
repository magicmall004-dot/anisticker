import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatPrice, statusColor, statusLabel } from "../lib/utils";
import { hapticNotification } from "../lib/telegram";

const COLORS = ["#04D9FF", "#7c3aed", "#FF3D8A", "#FFC93C", "#22c55e"];

export default function OrderConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  useEffect(() => {
    if (!order) { navigate("/"); return; }
    try { hapticNotification("success"); } catch (e) {}
  }, []);

  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    left: Math.round(Math.random() * 100),
    delay: (Math.random() * 0.5).toFixed(2),
    dur: (1.8 + Math.random() * 1.4).toFixed(2),
    color: COLORS[i % COLORS.length],
    rot: Math.round(Math.random() * 360),
    w: 6 + Math.round(Math.random() * 5),
  })), []);

  if (!order) return null;

  return (
    <div className="page oc-page" style={{ display:"flex", flexDirection:"column", minHeight:"100dvh" }}>
      <div className="oc-confetti">
        {pieces.map((p, i) => (
          <span key={i} style={{
            left: `${p.left}%`, width: p.w, height: p.w * 1.6, background: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
          }} />
        ))}
      </div>

      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"32px 24px", textAlign:"center", gap:16,
        position:"relative", zIndex:1,
      }}>
        <div className="oc-badge">
          <span className="oc-ring oc-ring-1" />
          <span className="oc-ring oc-ring-2" />
          <svg viewBox="0 0 52 52" width="40" height="40" fill="none">
            <path className="oc-check" d="M14 27 L23 36 L39 17" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="oc-rise" style={{ "--d": "0.35s" }}>
          <div className="oc-title">Order Placed!</div>
          <div style={{ color:"var(--hint)", fontSize:14, lineHeight:1.6 }}>
            Your order has been submitted.<br/>
            The owner will review and accept it shortly.
          </div>
        </div>

        <div className="card oc-rise" style={{ width:"100%", textAlign:"left", maxWidth:380, "--d": "0.5s" }}>
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

        <div className="oc-rise" style={{ color:"var(--hint)", fontSize:13, maxWidth:300, "--d": "0.65s" }}>
          Once your animated emoji pack is ready, you'll receive a notification in Telegram. 🎉
        </div>
      </div>

      <div className="oc-rise" style={{ padding:"16px 16px calc(32px + var(--safe-bottom))", display:"flex", flexDirection:"column", gap:10, position:"relative", zIndex:1, "--d": "0.8s" }}>
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
