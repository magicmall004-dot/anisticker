import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus, getPaymentMethods } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { hapticNotification, haptic, showConfirm } from "../lib/telegram";
import { ChevronLeft, Copy, Check, Clock, CheckCircle, XCircle, Search, RefreshCw, Gift, Film } from "lucide-react";
import AnimationPreview from "../components/AnimationPreview";
import DeliveryPanel from "../components/DeliveryPanel";

function statusCfg(s) {
  return {
    pending:   { label:"Pending",   color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
    accepted:  { label:"Accepted",  color:"#04D9FF", bg:"rgba(var(--accent-rgb),0.12)"  },
    done:      { label:"Done",      color:"#22c55e", bg:"rgba(34,197,94,0.12)"  },
    cancelled: { label:"Cancelled", color:"#ef4444", bg:"rgba(239,68,68,0.12)"  },
  }[s] || { label:s, color:"var(--hint)", bg:"rgba(255,255,255,0.05)" };
}

const STATUS_ACTIONS = {
  pending:   ["accepted","cancelled"],
  accepted:  ["done","cancelled"],
  cancelled: [], done: [],
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  function copy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); haptic("light");
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button onClick={copy} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:6,padding:"3px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:copied?"var(--success)":"var(--hint)",fontSize:11,fontWeight:600 }}>
      {copied ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
    </button>
  );
}

function OrderDetail({ order, onBack, onStatus, paymentMethods }) {
  const [busy, setBusy] = useState(false);
  const cfg = statusCfg(order.status);
  const method = paymentMethods.find(m => m.id === order.payment_method_id);

  async function act(newStatus) {
    const ok = await showConfirm(`Mark order as ${newStatus}?`);
    if (!ok) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      hapticNotification("success");
      onStatus(newStatus);
    } catch(e) {
      hapticNotification("error");
      alert(e.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontSize:13,fontWeight:600,padding:"10px 16px",display:"flex",alignItems:"center",gap:6 }}>
        <ChevronLeft size={15}/> Back to orders
      </button>

      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>

        {/* Customer */}
        <div className="card-glow">
          <div style={{ fontSize:10,fontWeight:800,color:"var(--accent)",letterSpacing:".08em",marginBottom:10 }}>CUSTOMER</div>
          <div className="row" style={{ gap:10 }}>
            {order.user?.photo_url && <img src={order.user.photo_url} alt="" style={{ width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(var(--accent-rgb),0.3)",flexShrink:0 }}/>}
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:15 }}>{order.user?.first_name} {order.user?.last_name}</div>
              {order.user?.username && <div style={{ fontSize:13,color:"var(--hint)" }}>@{order.user.username}</div>}
              <div style={{ fontSize:11,color:"var(--hint)",fontFamily:"monospace",marginTop:2 }}>ID: {order.user_id}</div>
            </div>
            <CopyBtn text={String(order.user_id)}/>
          </div>
        </div>

        {/* Status & total */}
        <div className="card">
          <div className="row-between" style={{ marginBottom:8 }}>
            <span style={{ fontWeight:600 }}>Status</span>
            <span style={{ fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:99,background:cfg.bg,color:cfg.color }}>{cfg.label}</span>
          </div>
          <div className="divider"/>
          <div className="row-between" style={{ marginTop:8 }}>
            <span style={{ color:"var(--hint)",fontSize:13 }}>Total</span>
            <span style={{ fontWeight:800,fontSize:18,color:"var(--accent)" }}>{formatPrice(order.total_price)}</span>
          </div>
          {(order.voucher_discount > 0 || order.loyalty_discount > 0) && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:3 }}>
              {order.subtotal > 0 && (
                <div className="row-between" style={{ fontSize:11, color:"var(--hint)" }}>
                  <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                </div>
              )}
              {order.voucher_discount > 0 && (
                <div className="row-between" style={{ fontSize:11, color:"var(--success)" }}>
                  <span><Gift size={11} style={{display:"inline",verticalAlign:"-1px"}}/> Voucher discount</span><span>-{formatPrice(order.voucher_discount)}</span>
                </div>
              )}
              {order.loyalty_discount > 0 && (
                <div className="row-between" style={{ fontSize:11, color:"var(--success)" }}>
                  <span>⭐ Loyalty discount</span><span>-{formatPrice(order.loyalty_discount)}</span>
                </div>
              )}
            </div>
          )}
          <div className="row-between" style={{ marginTop:6 }}>
            <span style={{ color:"var(--hint)",fontSize:11,fontFamily:"monospace" }}>#{order.id.slice(0,12)}</span>
            <CopyBtn text={order.id}/>
          </div>
          <div style={{ fontSize:11,color:"var(--hint)",marginTop:4 }}>{new Date(order.created_at).toLocaleString()}</div>
        </div>

        {/* Payment proof */}
        {(order.transaction_image_url || method) && (
          <div className="card">
            <div style={{ fontSize:10,fontWeight:800,color:"var(--accent)",letterSpacing:".08em",marginBottom:10 }}>PAYMENT</div>
            {method && (
              <div className="row" style={{ gap:10, marginBottom:order.transaction_image_url?12:0 }}>
                {method.logo_url && <img src={method.logo_url} alt="" style={{ width:32,height:32,borderRadius:8,objectFit:"contain",background:"var(--bg)",flexShrink:0 }}/>}
                <div style={{ fontWeight:600, fontSize:14 }}>{method.name}</div>
              </div>
            )}
            {order.transaction_image_url && (
              <a href={order.transaction_image_url} target="_blank" rel="noreferrer">
                <img src={order.transaction_image_url} alt="Payment proof" style={{ width:"100%", maxHeight:280, objectFit:"contain", borderRadius:10, background:"var(--bg)", border:"1px solid var(--border)" }}/>
              </a>
            )}
          </div>
        )}

        {/* Designs */}
        {order.items?.length > 0 && (
          <div className="card">
            <div style={{ fontSize:10,fontWeight:800,color:"var(--accent)",letterSpacing:".08em",marginBottom:10 }}>ORDERED DESIGNS ({order.items.length})</div>
            {order.items.map((item,i) => (
              <div key={i} style={{ paddingBottom:i<order.items.length-1?14:0,marginBottom:i<order.items.length-1?14:0,borderBottom:i<order.items.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                <div className="row" style={{ gap:10, alignItems:"flex-start" }}>
                  {item.designs?.file_url && (
                    <div style={{ width:52,height:52,borderRadius:10,overflow:"hidden",flexShrink:0,background:"var(--bg)" }}>
                      <AnimationPreview url={item.designs.file_url} fileType={item.designs.file_type} size="52px" autoplay loop/>
                    </div>
                  )}
                  <div style={{ flex:1 }}>
                    <div className="row" style={{ gap:6,flexWrap:"wrap",alignItems:"center" }}>
                      <span style={{ fontWeight:700,fontSize:14 }}>{item.designs?.name||"Design"}</span>
                      {item.designs?.custom_id && (
                        <span style={{ fontFamily:"monospace",fontSize:11,fontWeight:800,color:"var(--accent)",background:"rgba(var(--accent-rgb),0.1)",padding:"1px 6px",borderRadius:5 }}>#{item.designs.custom_id}</span>
                      )}
                      {item.designs?.custom_id && <CopyBtn text={String(item.designs.custom_id)}/>}
                    </div>
                    {(item.text_values||[]).map((tv,j) => (
                      <div key={j} style={{ fontSize:12,color:"var(--hint)",marginTop:2 }}>
                        <b style={{ color:"var(--text)" }}>{tv.name}:</b> {tv.value}
                      </div>
                    ))}
                    {item.custom_text && !(item.text_values||[]).length && (
                      <div style={{ fontSize:12,color:"var(--hint)",fontStyle:"italic",marginTop:2 }}>"{item.custom_text}"</div>
                    )}
                  </div>
                </div>
                {(item.primary_color||item.secondary_color||(item.extra_colors||[]).length>0) && (
                  <div style={{ marginTop:8, marginLeft:62, display:"flex", flexDirection:"column", gap:6 }}>
                    {[
                      item.primary_color && { label:"Primary", hex:item.primary_color },
                      item.secondary_color && { label:"Secondary", hex:item.secondary_color },
                      ...(item.extra_colors||[]).map((c,ci) => ({ label:`Extra ${ci+1}`, hex:c })),
                    ].filter(Boolean).map((c,ci) => (
                      <div key={ci} className="row-between" style={{ gap:6 }}>
                        <div className="row" style={{ gap:6 }}>
                          <div style={{ width:20,height:20,borderRadius:5,background:c.hex,border:"2px solid var(--border)",flexShrink:0 }}/>
                          <div style={{ fontSize:11,color:"var(--hint)" }}>{c.label}</div>
                          <div style={{ fontFamily:"monospace",fontSize:12,fontWeight:600 }}>{c.hex}</div>
                        </div>
                        <CopyBtn text={c.hex}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Brand setup */}
        {(order.logo_name||order.logo_symbol||order.primary_color||order.logo_file_url) && (
          <div className="card">
            <div style={{ fontSize:10,fontWeight:800,color:"var(--accent)",letterSpacing:".08em",marginBottom:10 }}>BRAND SETUP</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {order.logo_name && (
                <div className="row-between">
                  <div>
                    <div style={{ fontSize:11,color:"var(--hint)" }}>Name</div>
                    <div style={{ fontWeight:700,fontSize:15 }}>{order.logo_name}</div>
                  </div>
                  <CopyBtn text={order.logo_name}/>
                </div>
              )}
              {order.logo_symbol && (
                <div className="row-between">
                  <div>
                    <div style={{ fontSize:11,color:"var(--hint)" }}>Symbol</div>
                    <div style={{ fontWeight:700,fontSize:15 }}>{order.logo_symbol}</div>
                  </div>
                  <CopyBtn text={order.logo_symbol}/>
                </div>
              )}
              {order.tg_username && (
                <div className="row-between">
                  <div>
                    <div style={{ fontSize:11,color:"var(--hint)" }}>Username</div>
                    <div style={{ fontWeight:700,fontSize:15 }}>@{order.tg_username}</div>
                  </div>
                  <CopyBtn text={`@${order.tg_username}`}/>
                </div>
              )}
              {order.primary_color && (
                <div className="row-between">
                  <div className="row" style={{ gap:8 }}>
                    <div style={{ width:28,height:28,borderRadius:7,background:order.primary_color,border:"2px solid var(--border)" }}/>
                    <div>
                      <div style={{ fontSize:11,color:"var(--hint)" }}>Primary</div>
                      <div style={{ fontWeight:700,fontFamily:"monospace",fontSize:13 }}>{order.primary_color}</div>
                    </div>
                  </div>
                  <CopyBtn text={order.primary_color}/>
                </div>
              )}
              {order.secondary_color && (
                <div className="row-between">
                  <div className="row" style={{ gap:8 }}>
                    <div style={{ width:28,height:28,borderRadius:7,background:order.secondary_color,border:"2px solid var(--border)" }}/>
                    <div>
                      <div style={{ fontSize:11,color:"var(--hint)" }}>Secondary</div>
                      <div style={{ fontWeight:700,fontFamily:"monospace",fontSize:13 }}>{order.secondary_color}</div>
                    </div>
                  </div>
                  <CopyBtn text={order.secondary_color}/>
                </div>
              )}
              {order.logo_file_url && (
                <div>
                  <div style={{ fontSize:11,color:"var(--hint)",marginBottom:6 }}>Logo File</div>
                  <a href={order.logo_file_url} target="_blank" rel="noreferrer">
                    <img src={order.logo_file_url} alt="" style={{ width:64,height:64,objectFit:"contain",borderRadius:10,background:"var(--card)",border:"1px solid var(--border)" }}/>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery panel */}
        {order.status === "accepted" && <DeliveryPanel order={order} onDelivered={() => onStatus("done")}/>}

        {/* Action buttons */}
        {STATUS_ACTIONS[order.status]?.length > 0 && (
          <div style={{ display:"flex",gap:8 }}>
            {STATUS_ACTIONS[order.status].map(s => (
              <button key={s} disabled={busy}
                onClick={() => act(s)}
                style={{
                  flex:1,padding:14,borderRadius:"var(--radius-sm)",cursor:"pointer",
                  fontWeight:700,fontSize:14,fontFamily:"var(--font)",
                  background: s==="cancelled"?"rgba(239,68,68,0.15)":s==="done"?"rgba(34,197,94,0.15)":"rgba(var(--accent-rgb),0.15)",
                  color: s==="cancelled"?"var(--danger)":s==="done"?"var(--success)":"var(--accent)",
                  border: `1px solid ${s==="cancelled"?"rgba(239,68,68,0.3)":s==="done"?"rgba(34,197,94,0.3)":"rgba(var(--accent-rgb),0.3)"}`,
                }}>
                {busy?"…":s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OwnerOrders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [detailOrder, setDetailOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => { loadOrders(); getPaymentMethods().then(setPaymentMethods).catch(() => {}); }, []);

  async function loadOrders() {
    setLoading(true);
    try { setOrders(await getOrders()); }
    finally { setLoading(false); }
  }

  async function setStatus(orderId, newStatus) {
    setOrders(prev => prev.map(o => o.id===orderId ? {...o,status:newStatus} : o));
    if (detailOrder?.id === orderId) setDetailOrder(o => ({...o, status:newStatus}));
  }

  const filtered = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        o.user?.first_name?.toLowerCase().includes(s) ||
        o.user?.username?.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s) ||
        String(o.user_id).includes(s)
      );
    }
    return true;
  });

  const counts = ["pending","accepted","done","cancelled"].reduce((acc,s) => {
    acc[s] = orders.filter(o=>o.status===s).length; return acc;
  }, {});

  if (detailOrder) return (
    <OrderDetail
      order={detailOrder}
      onBack={() => setDetailOrder(null)}
      onStatus={(s) => { setStatus(detailOrder.id, s); setDetailOrder(o=>({...o,status:s})); }}
      paymentMethods={paymentMethods}
    />
  );

  return (
    <div>
      {/* Search */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"8px 12px" }}>
          <Search size={15} color="var(--hint)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, username, ID…"
            style={{ flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:13,fontFamily:"var(--font)" }}/>
          <button onClick={loadOrders} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--hint)",padding:0 }}>
            <RefreshCw size={14} className={loading?"refresh-spin":""}/>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding:"8px 16px",display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none" }}>
        {["all","pending","accepted","done","cancelled"].map(f => {
          const cfg = statusCfg(f);
          const count = f==="all" ? orders.length : counts[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"6px 12px",borderRadius:99,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,display:"flex",alignItems:"center",gap:5,
              background:filter===f?(f==="all"?"rgba(var(--accent-rgb),0.15)":cfg.bg):"rgba(255,255,255,0.05)",
              color:filter===f?(f==="all"?"var(--accent)":cfg.color):"var(--hint)",
            }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {count > 0 && <span style={{ background:"rgba(255,255,255,0.15)",borderRadius:99,padding:"0 5px",fontSize:10 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <div style={{ padding:"4px 16px", display:"flex", flexDirection:"column", gap:8 }}>
        {loading ? (
          <div style={{ display:"flex",justifyContent:"center",padding:40 }}><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding:"32px 0" }}>No orders found</div>
        ) : filtered.map(order => {
          const cfg = statusCfg(order.status);
          return (
            <div key={order.id} className="card" onClick={() => setDetailOrder(order)}
              style={{ cursor:"pointer",padding:0,overflow:"hidden" }}>
              <div style={{ height:3,background:cfg.color,opacity:0.7 }}/>
              <div style={{ padding:"12px 14px" }}>
                <div className="row-between" style={{ marginBottom:8 }}>
                  <div className="row" style={{ gap:8 }}>
                    {order.user?.photo_url && (
                      <img src={order.user.photo_url} alt="" style={{ width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0 }}/>
                    )}
                    <div>
                      <div style={{ fontWeight:700,fontSize:13 }}>{order.user?.first_name} {order.user?.last_name}</div>
                      {order.user?.username && <div style={{ fontSize:11,color:"var(--hint)" }}>@{order.user.username}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:cfg.bg,color:cfg.color }}>
                    {cfg.label}
                  </div>
                </div>
                <div className="row-between">
                  <div className="row" style={{ gap:6 }}>
                    {order.items?.slice(0,3).map((item,i) => (
                      <div key={i} style={{ width:28,height:28,borderRadius:6,overflow:"hidden",background:"var(--bg)" }}>
                        {item.designs?.file_url
                          ? <AnimationPreview url={item.designs.file_url} fileType={item.designs.file_type} size="28px" autoplay={false} loop={false}/>
                          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}><Film size={16}/></div>}
                      </div>
                    ))}
                    {(order.items?.length||0) > 3 && (
                      <div style={{ fontSize:10,color:"var(--hint)",fontWeight:700 }}>+{order.items.length-3}</div>
                    )}
                    <div style={{ fontSize:11,color:"var(--hint)",marginLeft:4 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight:800,fontSize:15,color:"var(--accent)" }}>{formatPrice(order.total_price)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
