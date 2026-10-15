import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Wallet, Plus, Upload, History, Check, X, Clock, Gift } from "lucide-react";
import { getMyBalance, getBalanceHistory, requestTopup, getPaymentMethods, uploadTransaction, useRedeemCode } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, hapticNotification, haptic, showAlert } from "../lib/telegram";
import AnimatedNumber from "../components/AnimatedNumber";

export default function WalletPage() {
  const navigate = useNavigate();
  const [balance,     setBalance]     = useState(0);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showTopup,   setShowTopup]   = useState(false);
  const [redeemCode,  setRedeemCode]  = useState("");
  const [redeeming,   setRedeeming]   = useState(false);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    load();
    return hideBackButton;
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [b, h] = await Promise.all([getMyBalance(), getBalanceHistory()]);
      setBalance(b.balance);
      setHistory(h);
    } finally { setLoading(false); }
  }

  async function redeem() {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await useRedeemCode(redeemCode.trim());
      hapticNotification("success");
      await showAlert(`🎉 Code redeemed! ${formatPrice(res.amount)} added to your balance.`);
      setRedeemCode("");
      load();
    } catch (e) {
      hapticNotification("error");
      await showAlert(e.response?.data?.detail || "Invalid code");
    } finally { setRedeeming(false); }
  }

  if (showTopup) {
    return <TopupForm onBack={() => setShowTopup(false)} onDone={() => { setShowTopup(false); load(); }} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">My Wallet</div>
      </div>
      <div className="page-body wl-auto">
        <div className="card-glow" style={{ textAlign:"center", padding:"28px 16px" }}>
          <div className="wl-icon"><Wallet size={28} color="var(--accent)" style={{ marginBottom:8 }} /></div>
          <div style={{ fontSize:12, color:"var(--hint)", marginBottom:4 }}>Current Balance</div>
          <div style={{ fontSize:32, fontWeight:800 }} className="glow-text">
            {loading ? "…" : <AnimatedNumber value={balance} format={formatPrice} />}
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ padding:14 }} onClick={() => { haptic("medium"); setShowTopup(true); }}>
          <Plus size={18} /> Top Up Balance
        </button>

        <div className="card" style={{ border:"1px dashed rgba(var(--accent-rgb),0.3)" }}>
          <div className="row" style={{ gap:8, marginBottom:10 }}>
            <Gift size={18} color="var(--accent)" />
            <span style={{ fontWeight:600, fontSize:14 }}>Have a Redeem Code?</span>
          </div>
          <div className="row" style={{ gap:8 }}>
            <input className="input" style={{ flex:1, textTransform:"uppercase", fontFamily:"monospace" }}
              placeholder="ENTER CODE" value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && redeem()} />
            <button className="btn btn-primary" style={{ padding:"10px 16px" }}
              disabled={!redeemCode.trim() || redeeming} onClick={redeem}>
              {redeeming ? "…" : "Redeem"}
            </button>
          </div>
        </div>

        <div className="section-title"><div className="row" style={{ gap:6 }}><History size={13} /> Transaction History</div></div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:24 }}><div className="spinner" /></div>
        ) : history.length === 0 ? (
          <div className="empty-state" style={{ padding:"24px 0" }}>No transactions yet</div>
        ) : history.map((tx, i) => <div key={tx.id} className="wl-tx" style={{ "--i": Math.min(i, 12) }}><TxRow tx={tx} /></div>)}
      </div>
    </div>
  );
}

function TxRow({ tx }) {
  const config = {
    topup:         { label:"Top Up",          color:"var(--success)", sign:"+" },
    manual_add:    { label:"Added by Owner",  color:"var(--success)", sign:"+" },
    manual_remove: { label:"Removed by Owner",color:"var(--danger)",  sign:"-" },
    order_payment: { label:"Order Payment",   color:"var(--danger)",  sign:"-" },
    order_refund:  { label:"Order Refund",    color:"var(--success)", sign:"+" },
  }[tx.type] || { label:tx.type, color:"var(--hint)", sign:"" };

  return (
    <div className="card" style={{ padding:"12px 14px" }}>
      <div className="row-between">
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>{config.label}</div>
          <div style={{ fontSize:11, color:"var(--hint)", marginTop:2 }}>{new Date(tx.created_at).toLocaleString()}</div>
          {tx.note && <div style={{ fontSize:12, color:"var(--hint)", marginTop:2 }}>{tx.note}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontWeight:800, color:config.color }}>{config.sign}{formatPrice(tx.amount)}</div>
          {tx.status === "pending" && <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(245,158,11,0.15)",color:"var(--warning)" }}><Clock size={9} style={{ display:"inline",marginRight:2 }} /> Pending</span>}
          {tx.status === "rejected" && <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(239,68,68,0.15)",color:"var(--danger)" }}><X size={9} style={{ display:"inline",marginRight:2 }} /> Rejected</span>}
        </div>
      </div>
    </div>
  );
}

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
      {copied ? <><Check size={11}/>Copied</> : "Copy"}
    </button>
  );
}

function TopupForm({ onBack, onDone }) {
  const [amount,    setAmount]    = useState("");
  const [methods,   setMethods]   = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [txImage,   setTxImage]   = useState(null);
  const [txFile,    setTxFile]    = useState(null);
  const [uploading, setUploading] = useState(false);
  const [placing,   setPlacing]   = useState(false);
  const fileRef = useRef();

  useEffect(() => { getPaymentMethods().then(setMethods); }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const res = await uploadTransaction(file); setTxImage(res.url); setTxFile(file.name); }
    finally { setUploading(false); }
  }

  async function submit() {
    if (!amount || Number(amount) <= 0 || !txImage) return;
    if (methods.length > 0 && !selected) { alert("Please select a payment method"); return; }
    setPlacing(true);
    try {
      await requestTopup({ amount: Number(amount), transaction_image_url: txImage, payment_method_id: selected?.id || null });
      hapticNotification("success");
      onDone();
    } catch (e) { alert("Failed: " + (e.response?.data?.detail || e.message)); }
    finally { setPlacing(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={onBack}><ChevronLeft size={22} /></button>
        <div className="page-title">Top Up Balance</div>
      </div>
      <div className="page-body">
        <div className="field">
          <div className="label">Amount (MMK)</div>
          <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" style={{ fontSize:18, fontWeight:700 }} />
        </div>
        {methods.length > 0 && (
          <>
            <div className="section-title">Payment Method</div>
            {methods.map((m) => (
              <div key={m.id} className="card" onClick={() => setSelected(m)} style={{ cursor:"pointer", border:`2px solid ${selected?.id===m.id?"var(--accent)":"rgba(255,255,255,0.05)"}` }}>
                <div className="row-between">
                  <div className="row" style={{ gap:10 }}>
                    {m.logo_url && <img src={m.logo_url} alt="" style={{ width:36,height:36,objectFit:"contain",borderRadius:8 }} />}
                    <div>
                      <div style={{ fontWeight:600 }}>{m.name}</div>
                      {m.account_number && (
                        <div className="row" style={{ gap:6, marginTop:2 }}>
                          <div style={{ fontSize:12, fontFamily:"monospace" }}>{m.account_number}</div>
                          <CopyBtn text={m.account_number} />
                        </div>
                      )}
                    </div>
                  </div>
                  {selected?.id === m.id && <Check size={18} color="var(--accent)" />}
                </div>
              </div>
            ))}
            {selected && (
              <div style={{ fontSize:13, color:"var(--accent)", background:"rgba(var(--accent-rgb),0.08)", border:"1px solid rgba(var(--accent-rgb),0.2)", borderRadius:10, padding:"10px 12px" }}>
                Send {amount ? formatPrice(Number(amount)) : "your amount"} to {selected.name}{selected.account_number ? ` (${selected.account_number})` : ""}, then upload your payment screenshot below.
              </div>
            )}
          </>
        )}
        <div className="section-title">Payment Screenshot</div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
        {!txImage ? (
          <button className="btn btn-secondary btn-full" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ padding:"24px 16px", flexDirection:"column", gap:8, border:"2px dashed rgba(var(--accent-rgb),0.2)" }}>
            <Upload size={24} color="var(--accent)" />
            <span style={{ color:"var(--accent)" }}>{uploading ? "Uploading…" : "Tap to upload"}</span>
          </button>
        ) : (
          <div className="card">
            <div className="row" style={{ gap:12 }}>
              <img src={txImage} alt="" style={{ width:60,height:60,objectFit:"cover",borderRadius:8 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{txFile}</div>
                <div style={{ fontSize:12, color:"var(--success)" }}><Check size={12} style={{display:"inline",verticalAlign:"-1px"}}/> Uploaded</div>
                <button className="btn btn-ghost" style={{ padding:"4px 0", fontSize:12 }} onClick={() => fileRef.current?.click()}>Change</button>
              </div>
            </div>
          </div>
        )}
        <button className="btn btn-primary btn-full" disabled={!amount||!txImage||placing||(methods.length>0&&!selected)} onClick={submit} style={{ padding:16 }}>
          {placing ? "Submitting…" : "Submit Top-Up Request"}
        </button>
        <div style={{ fontSize:12, color:"var(--hint)", textAlign:"center" }}>Owner will review and approve your top-up.</div>
      </div>
    </div>
  );
}
