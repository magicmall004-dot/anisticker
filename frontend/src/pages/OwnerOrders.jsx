import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus } from "../lib/api";
import { formatPrice, statusColor, statusLabel } from "../lib/utils";
import { hapticNotification } from "../lib/telegram";
import { ExternalLink, Eye } from "lucide-react";

const STATUS_ACTIONS = {
  pending:   ["accepted", "cancelled"],
  accepted:  ["done", "cancelled"],
  cancelled: [],
  done:      [],
};

export default function OwnerOrders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [detailOrder, setDetailOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(orderId, status) {
    try {
      await updateOrderStatus(orderId, status);
      hapticNotification("success");
      await loadOrders();
      setDetailOrder(null);
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    }
  }

  const filterTabs = ["all","pending","accepted","done","cancelled"];
  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (detailOrder) return <OrderDetail order={detailOrder} onBack={() => setDetailOrder(null)} onStatus={setStatus} />;

  return (
    <div className="page-body">
      {/* Filter tabs */}
      <div className="scroll-row">
        {filterTabs.map((f) => (
          <div key={f} className={`pill ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}>
            {f === "all" ? "All" : statusLabel(f)}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
          <div className="spinner" />
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state" style={{ padding:"32px 0" }}>
          No orders {filter !== "all" && `with status "${statusLabel(filter)}"`}
        </div>
      ) : (
        shown.map((order) => (
          <div key={order.id} className="card" onClick={() => setDetailOrder(order)}
            style={{ cursor:"pointer" }}>
            <div className="row-between" style={{ marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {order.user?.photo_url && (
                  <img src={order.user.photo_url} alt=""
                    style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover" }} />
                )}
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>
                    {order.user?.first_name} {order.user?.last_name}
                  </div>
                  {order.user?.username && (
                    <div style={{ fontSize:12, color:"var(--hint)" }}>@{order.user.username}</div>
                  )}
                </div>
              </div>
              <span style={{
                fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99,
                background: statusColor(order.status) + "22",
                color:      statusColor(order.status),
              }}>
                {statusLabel(order.status)}
              </span>
            </div>

            <div className="row-between">
              <div style={{ fontSize:12, color:"var(--hint)" }}>
                {new Date(order.created_at).toLocaleString()}
              </div>
              <div style={{ fontWeight:700, color:"var(--accent2)" }}>
                {formatPrice(order.total_price)}
              </div>
            </div>

            {/* Quick actions */}
            {STATUS_ACTIONS[order.status]?.length > 0 && (
              <div className="row" style={{ marginTop:10, gap:8 }}
                onClick={(e) => e.stopPropagation()}>
                {STATUS_ACTIONS[order.status].map((s) => (
                  <button key={s}
                    className={`btn btn-${s === "cancelled" ? "danger" : s === "done" ? "success" : "primary"}`}
                    style={{ flex:1, padding:"8px 10px", fontSize:13 }}
                    onClick={() => setStatus(order.id, s)}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}


function OrderDetail({ order, onBack, onStatus }) {
  const [busy, setBusy] = useState(false);

  async function act(status) {
    setBusy(true);
    try { await onStatus(order.id, status); }
    finally { setBusy(false); }
  }

  return (
    <div className="page-body">
      <button className="btn btn-ghost" style={{ alignSelf:"flex-start", padding:"6px 0" }}
        onClick={onBack}>
        ← Back to orders
      </button>

      {/* Customer */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:8 }}>Customer</div>
        <div className="row" style={{ gap:10 }}>
          {order.user?.photo_url && (
            <img src={order.user.photo_url} alt=""
              style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover" }} />
          )}
          <div>
            <div style={{ fontWeight:600 }}>{order.user?.first_name} {order.user?.last_name}</div>
            {order.user?.username && <div style={{ fontSize:13, color:"var(--hint)" }}>@{order.user.username}</div>}
            <div style={{ fontSize:12, color:"var(--hint)" }}>ID: {order.user_id}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="card">
        <div className="row-between">
          <span style={{ fontWeight:600 }}>Status</span>
          <span style={{
            fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99,
            background: statusColor(order.status) + "22",
            color:      statusColor(order.status),
          }}>
            {statusLabel(order.status)}
          </span>
        </div>
        <div className="divider" style={{ margin:"10px 0" }} />
        <div className="row-between">
          <span style={{ color:"var(--hint)" }}>Total</span>
          <span style={{ fontWeight:700, fontSize:16 }}>{formatPrice(order.total_price)}</span>
        </div>
      </div>

      {/* Brand info */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:8 }}>Brand Setup</div>
        {order.logo_name && <div><b>Name:</b> {order.logo_name}</div>}
        {order.logo_symbol && <div><b>Symbol:</b> {order.logo_symbol}</div>}
        {order.logo_file_url && (
          <a href={order.logo_file_url} target="_blank" rel="noreferrer"
            style={{ color:"var(--link)", fontSize:13, display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
            <ExternalLink size={13} /> View Logo File
          </a>
        )}
        {order.add_username && <div style={{ marginTop:4 }}><b>Username:</b> {order.tg_username}</div>}
        <div style={{ marginTop:6, display:"flex", gap:8 }}>
          {order.primary_color && (
            <div className="row" style={{ gap:6 }}>
              <div style={{ width:20,height:20,borderRadius:"50%",background:order.primary_color,border:"2px solid rgba(255,255,255,.2)" }} />
              <span style={{ fontSize:12 }}>{order.primary_color}</span>
            </div>
          )}
          {order.secondary_color && (
            <div className="row" style={{ gap:6 }}>
              <div style={{ width:20,height:20,borderRadius:"50%",background:order.secondary_color,border:"2px solid rgba(255,255,255,.2)" }} />
              <span style={{ fontSize:12 }}>{order.secondary_color}</span>
            </div>
          )}
        </div>
      </div>

      {/* Transaction screenshot */}
      {order.transaction_image_url && (
        <div className="card">
          <div className="section-title" style={{ marginBottom:8 }}>Transaction Screenshot</div>
          <img src={order.transaction_image_url} alt="transaction"
            style={{ width:"100%", borderRadius:"var(--radius-sm)", objectFit:"contain", maxHeight:240 }} />
        </div>
      )}

      {/* Designs */}
      {order.items?.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom:8 }}>Ordered Designs</div>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom:10, paddingBottom:10,
              borderBottom: idx < order.items.length-1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
              <div style={{ fontWeight:600 }}>{item.designs?.name || "Design"}</div>
              {item.custom_text && (
                <div style={{ fontSize:13, color:"var(--hint)" }}>Text: "{item.custom_text}"</div>
              )}
              <div style={{ display:"flex", gap:6, marginTop:4 }}>
                {item.primary_color && (
                  <div style={{ width:16,height:16,borderRadius:"50%",background:item.primary_color,border:"2px solid rgba(255,255,255,.2)" }} />
                )}
                {item.secondary_color && (
                  <div style={{ width:16,height:16,borderRadius:"50%",background:item.secondary_color,border:"2px solid rgba(255,255,255,.2)" }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {STATUS_ACTIONS[order.status]?.length > 0 && (
        <div style={{ display:"flex", gap:10 }}>
          {STATUS_ACTIONS[order.status].map((s) => (
            <button key={s} disabled={busy}
              className={`btn btn-${s === "cancelled" ? "danger" : s === "done" ? "success" : "primary"} btn-full`}
              onClick={() => act(s)}>
              {busy ? "…" : statusLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

