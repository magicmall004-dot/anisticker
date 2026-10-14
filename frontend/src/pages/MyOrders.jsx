import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Copy, Check, X, Clock, CheckCircle, XCircle, Gift, Film } from "lucide-react";
import { getMyOrders, cancelOrder, getPaymentMethods } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, hapticNotification, haptic, showConfirm } from "../lib/telegram";
import AnimationPreview from "../components/AnimationPreview";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
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

function statusConfig(s) {
  return {
    pending:   { label:"Pending",   color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  icon:Clock },
    accepted:  { label:"Accepted",  color:"#04D9FF", bg:"rgba(4,217,255,0.12)",   icon:CheckCircle },
    done:      { label:"Done",      color:"#22c55e", bg:"rgba(34,197,94,0.12)",   icon:CheckCircle },
    cancelled: { label:"Cancelled", color:"#ef4444", bg:"rgba(239,68,68,0.12)",   icon:XCircle },
  }[s] || { label:s, color:"var(--hint)", bg:"rgba(255,255,255,0.05)", icon:Clock };
}

const STEPS = ["pending","accepted","done"];



function OrderProgress({ status }) {
  if (status === "cancelled") return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",color:"var(--danger)",fontSize:13,fontWeight:600 }}>
      <XCircle size={16}/> Order Cancelled
    </div>
  );
  const cur = STEPS.indexOf(status);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:0,padding:"12px 0" }}>
      {STEPS.map((step,idx) => {
        const done = idx <= cur;
        const active = idx === cur;
        const cfg = statusConfig(step);
        return (
          <div key={step} style={{ display:"flex",alignItems:"center" }}>
            {idx > 0 && (
              <div className={`op-line ${done?"on":""}`} style={{ width:40,height:2,background:done?"var(--accent)":"rgba(255,255,255,0.1)",transition:"background 0.4s",marginBottom:18 }}/>
            )}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
              <div className={active?"op-dot-active":""} style={{
                width:28,height:28,borderRadius:"50%",
                background:done?cfg.color:"rgba(255,255,255,0.08)",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:active?`0 0 12px ${cfg.color}66`:"none",
                transition:"all 0.3s",
              }}>
                {done ? <Check size={14} color="#000" strokeWidth={3}/> : <span style={{ fontSize:11,color:"var(--hint)",fontWeight:700 }}>{idx+1}</span>}
              </div>
              <div style={{ fontSize:10,color:done?cfg.color:"var(--hint)",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em" }}>
                {statusConfig(step).label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderDetail({ order, onBack, onCancelled, paymentMethods }) {
  const [cancelling, setCancelling] = useState(false);
  const cfg = statusConfig(order.status);
  const method = paymentMethods.find(m => m.id === order.payment_method_id);

  async function cancel() {
    const ok = await showConfirm("Cancel this order? Your balance will be refunded.");
    if (!ok) return;
    setCancelling(true);
    try { await cancelOrder(order.id); hapticNotification("success"); onCancelled(); }
    catch (e) { hapticNotification("error"); alert(e.response?.data?.detail||"Failed"); }
    finally { setCancelling(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={onBack}><ChevronLeft size={22}/></button>
        <div className="page-title">Order Detail</div>
        <div style={{ fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99,background:cfg.bg,color:cfg.color }}>
          {cfg.label}
        </div>
      </div>
      <div className="page-body">

        {/* Progress */}
        <div className="card-glow">
          <OrderProgress status={order.status}/>
          <div className="divider"/>
          <div className="row-between" style={{ marginTop:10 }}>
            <div style={{ fontSize:12,color:"var(--hint)" }}>{new Date(order.created_at).toLocaleString()}</div>
            <div style={{ fontWeight:800,fontSize:18,color:"var(--accent)" }}>{formatPrice(order.total_price)}</div>
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
          <div className="row" style={{ gap:6,marginTop:6 }}>
            <div style={{ fontSize:11,color:"var(--hint)",fontFamily:"monospace" }}>#{order.id.slice(0,12)}</div>
            <CopyBtn text={order.id}/>
          </div>
        </div>

        {/* Status message */}
        <div style={{ padding:"10px 14px",borderRadius:"var(--radius-sm)",background:cfg.bg,border:`1px solid ${cfg.color}33`,fontSize:13,color:cfg.color,fontWeight:500 }}>
          {order.status==="pending"&&"⏳ Your order is pending review. We'll accept it shortly."}
          {order.status==="accepted"&&"🎨 We're working on your design! It will be delivered via bot soon."}
          {order.status==="done"&&"🎉 Your animated emoji pack has been delivered! Check your Telegram messages."}
          {order.status==="cancelled"&&"❌ This order was cancelled. Your balance has been refunded."}
        </div>

        {/* Payment proof */}
        {(order.transaction_image_url || method) && (
          <>
            <div className="section-title">Payment</div>
            <div className="card">
              {method && (
                <div className="row" style={{ gap:10, marginBottom:order.transaction_image_url?12:0 }}>
                  {method.logo_url && <img src={method.logo_url} alt="" style={{ width:32,height:32,borderRadius:8,objectFit:"contain",background:"var(--bg)",flexShrink:0 }}/>}
                  <div style={{ fontWeight:600, fontSize:14 }}>{method.name}</div>
                </div>
              )}
              {order.transaction_image_url && (
                <img src={order.transaction_image_url} alt="Payment proof" style={{ width:"100%", maxHeight:240, objectFit:"contain", borderRadius:10, background:"var(--bg)", border:"1px solid var(--border)" }}/>
              )}
            </div>
          </>
        )}

        {/* Designs */}
        {order.items?.length > 0 && (
          <>
            <div className="section-title">Ordered Designs ({order.items.length})</div>
            {order.items.map((item,i) => (
              <div key={i} className="card">
                <div className="row" style={{ gap:10 }}>
                  {item.designs?.file_url && (
                    <div style={{ width:52,height:52,borderRadius:10,overflow:"hidden",flexShrink:0,background:"var(--bg)" }}>
                      <AnimationPreview url={item.designs.file_url} fileType={item.designs.file_type} size="52px" autoplay loop/>
                    </div>
                  )}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:14 }}>{item.designs?.name||"Design"}</div>
                    {(item.text_values||[]).map((tv,j) => (
                      <div key={j} style={{ fontSize:12,color:"var(--hint)",marginTop:2 }}>
                        <b style={{ color:"var(--text)" }}>{tv.name}:</b> {tv.value}
                      </div>
                    ))}
                    {item.custom_text && !(item.text_values||[]).length && (
                      <div style={{ fontSize:12,color:"var(--hint)",marginTop:2 }}>"{item.custom_text}"</div>
                    )}
                  </div>
                  {(item.primary_color||item.secondary_color||(item.extra_colors||[]).length>0) && (
                    <div className="row" style={{ gap:6, flexWrap:"wrap" }}>
                      {item.primary_color && <div style={{ width:20,height:20,borderRadius:5,background:item.primary_color,border:"2px solid var(--border)" }}/>}
                      {item.secondary_color && <div style={{ width:20,height:20,borderRadius:5,background:item.secondary_color,border:"2px solid var(--border)" }}/>}
                      {(item.extra_colors||[]).map((c,ci) => (
                        <div key={ci} style={{ width:20,height:20,borderRadius:5,background:c,border:"2px solid var(--border)" }}/>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Brand setup */}
        {(order.logo_name||order.logo_symbol||order.primary_color) && (
          <>
            <div className="section-title">Brand Setup</div>
            <div className="card" style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {order.logo_name && (
                <div className="row-between">
                  <div>
                    <div style={{ fontSize:11,color:"var(--hint)" }}>Brand Name</div>
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
              {(order.primary_color||order.secondary_color) && (
                <div>
                  <div style={{ fontSize:11,color:"var(--hint)",marginBottom:8 }}>Brand Colors</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {order.primary_color && (
                      <div className="row-between">
                        <div className="row" style={{ gap:8 }}>
                          <div style={{ width:28,height:28,borderRadius:7,background:order.primary_color,border:"2px solid var(--border)" }}/>
                          <div>
                            <div style={{ fontSize:10,color:"var(--hint)" }}>Primary</div>
                            <div style={{ fontWeight:600,fontFamily:"monospace",fontSize:13 }}>{order.primary_color}</div>
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
                            <div style={{ fontSize:10,color:"var(--hint)" }}>Secondary</div>
                            <div style={{ fontWeight:600,fontFamily:"monospace",fontSize:13 }}>{order.secondary_color}</div>
                          </div>
                        </div>
                        <CopyBtn text={order.secondary_color}/>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {order.logo_file_url && (
                <div>
                  <div style={{ fontSize:11,color:"var(--hint)",marginBottom:6 }}>Logo File</div>
                  <img src={order.logo_file_url} alt="" style={{ width:64,height:64,objectFit:"contain",borderRadius:10,background:"var(--card)",border:"1px solid var(--border)" }}/>
                </div>
              )}
            </div>
          </>
        )}

        {order.status === "pending" && (
          <button className="btn btn-danger btn-full" disabled={cancelling} onClick={cancel} style={{ padding:14 }}>
            {cancelling ? "Cancelling…" : "Cancel Order & Refund"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState(null);
  const [filter,  setFilter]  = useState("all");

  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    showBackButton(() => { if (detail) setDetail(null); else navigate(-1); });
    load();
    getPaymentMethods().then(setPaymentMethods).catch(() => {});
    return hideBackButton;
  }, []);

  async function load() {
    setLoading(true);
    try { setOrders(await getMyOrders()); }
    finally { setLoading(false); }
  }

  if (detail) return <OrderDetail order={detail} onBack={() => setDetail(null)} onCancelled={() => { load(); setDetail(null); }} paymentMethods={paymentMethods}/>;

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}><ChevronLeft size={22}/></button>
        <div className="page-title">My Orders</div>
        <div style={{ fontSize:12,color:"var(--hint)",fontWeight:600 }}>{orders.length} total</div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding:"8px 16px",display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none" }}>
        {["all","pending","accepted","done","cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
            background:filter===f?"rgba(4,217,255,0.15)":"rgba(255,255,255,0.06)",
            color:filter===f?"var(--accent)":"var(--hint)",
            boxShadow:filter===f?"0 0 10px rgba(4,217,255,0.2)":"none",
          }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
            {f !== "all" && orders.filter(o=>o.status===f).length > 0 && (
              <span style={{ marginLeft:4,background:filter===f?"rgba(4,217,255,0.2)":"rgba(255,255,255,0.1)",borderRadius:99,padding:"0 5px",fontSize:10 }}>
                {orders.filter(o=>o.status===f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="page-body" style={{ paddingTop:4 }}>
        {loading ? (
          <div style={{ display:"flex",justifyContent:"center",padding:48 }}><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={40}/>
            <div style={{ fontWeight:600 }}>{filter==="all"?"No orders yet":`No ${filter} orders`}</div>
          </div>
        ) : filtered.map(order => {
          const cfg = statusConfig(order.status);
          const Icon = cfg.icon;
          return (
            <div key={order.id} className="card" onClick={() => setDetail(order)} style={{ cursor:"pointer",padding:0,overflow:"hidden" }}>
              {/* Status bar */}
              <div style={{ height:3,background:cfg.color,opacity:0.7 }}/>
              <div style={{ padding:"12px 14px" }}>
                <div className="row-between" style={{ marginBottom:8 }}>
                  <div className="row" style={{ gap:8 }}>
                    {/* Design previews */}
                    {order.items?.slice(0,3).map((item,i) => (
                      <div key={i} style={{ width:32,height:32,borderRadius:8,overflow:"hidden",background:"var(--bg)",flexShrink:0 }}>
                        {item.designs?.file_url
                          ? <AnimationPreview url={item.designs.file_url} fileType={item.designs.file_type} size="32px" autoplay={false} loop={false}/>
                          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}><Film size={16}/></div>}
                      </div>
                    ))}
                    {(order.items?.length||0) > 3 && (
                      <div style={{ width:32,height:32,borderRadius:8,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"var(--hint)",fontWeight:700 }}>
                        +{order.items.length-3}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:99,background:cfg.bg,color:cfg.color,fontSize:11,fontWeight:700 }}>
                    <Icon size={11}/> {cfg.label}
                  </div>
                </div>
                <div className="row-between">
                  <div>
                    <div style={{ fontSize:12,color:"var(--hint)",fontFamily:"monospace" }}>#{order.id.slice(0,8)}</div>
                    <div style={{ fontSize:11,color:"var(--hint)",marginTop:2 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight:800,fontSize:16,color:"var(--accent)" }}>{formatPrice(order.total_price)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
