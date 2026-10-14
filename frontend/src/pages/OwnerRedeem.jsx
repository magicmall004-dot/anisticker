import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Power, Gift, X, FileText } from "lucide-react";
import { createRedeemCode, getRedeemCodes, toggleRedeemCode, deleteRedeemCode } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { hapticNotification, haptic, showConfirm } from "../lib/telegram";

export default function OwnerRedeem() {
  const [codes,    setCodes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount,   setAmount]   = useState("");
  const [maxUses,  setMaxUses]  = useState("1");
  const [customCode,setCustomCode]=useState("");
  const [note,     setNote]     = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() { setLoading(true); try { setCodes(await getRedeemCodes()); } finally { setLoading(false); } }

  async function create() {
    if (!amount||Number(amount)<=0) return;
    setCreating(true);
    try {
      await createRedeemCode({ code:customCode.trim()||null, amount:Number(amount), max_uses:Number(maxUses)||1, note:note.trim()||null });
      hapticNotification("success");
      setAmount(""); setMaxUses("1"); setCustomCode(""); setNote(""); setShowForm(false);
      load();
    } catch (e) { alert("Failed: "+(e.response?.data?.detail||e.message)); }
    finally { setCreating(false); }
  }

  async function toggle(code) { await toggleRedeemCode(code.id); haptic("light"); load(); }
  async function remove(code) {
    const ok = await showConfirm(`Delete code "${code.code}"?`);
    if (!ok) return;
    await deleteRedeemCode(code.id); hapticNotification("success"); load();
  }
  function copyCode(code) { navigator.clipboard.writeText(code); haptic("light"); }

  return (
    <div className="page-body">
      {!showForm ? (
        <button className="btn btn-primary btn-full" onClick={() => setShowForm(true)} style={{ padding:14 }}>
          <Plus size={16}/> Generate New Code
        </button>
      ) : (
        <div className="card">
          <div className="row-between" style={{ marginBottom:10 }}>
            <div style={{ fontWeight:700 }}>New Redeem Code</div>
            <button className="btn btn-ghost" style={{ padding:4 }} onClick={() => setShowForm(false)}><X size={14}/></button>
          </div>
          <div className="field" style={{ marginBottom:10 }}><div className="label">Amount (MMK)</div><input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000"/></div>
          <div className="field" style={{ marginBottom:10 }}><div className="label">Max Uses</div><input className="input" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="1"/></div>
          <div className="field" style={{ marginBottom:10 }}><div className="label">Custom Code (optional)</div><input className="input" style={{ textTransform:"uppercase",fontFamily:"monospace" }} value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase())} placeholder="Leave empty to auto-generate"/></div>
          <div className="field" style={{ marginBottom:12 }}><div className="label">Note (optional)</div><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Christmas giveaway"/></div>
          <button className="btn btn-primary btn-full" disabled={!amount||creating} onClick={create}>{creating?"Creating…":"Generate Code"}</button>
        </div>
      )}

      <div className="section-title">All Codes ({codes.length})</div>
      {loading ? <div style={{ display:"flex",justifyContent:"center",padding:24 }}><div className="spinner"/></div>
      : codes.length===0 ? <div className="empty-state" style={{ padding:"24px 0" }}><Gift size={32}/><div>No redeem codes yet</div></div>
      : codes.map((c) => {
        const fullyUsed = c.used_count>=c.max_uses;
        return (
          <div key={c.id} className="card" style={{ border:!c.is_active?"1px solid rgba(239,68,68,0.2)":fullyUsed?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(34,197,94,0.2)", opacity:!c.is_active||fullyUsed?0.6:1 }}>
            <div className="row-between" style={{ marginBottom:6 }}>
              <div className="row" style={{ gap:6 }}>
                <span style={{ fontFamily:"monospace",fontWeight:800,fontSize:15,letterSpacing:1 }}>{c.code}</span>
                <button onClick={() => copyCode(c.code)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--hint)",padding:2 }}><Copy size={13}/></button>
              </div>
              <span style={{ fontWeight:800,color:"var(--success)" }}>{formatPrice(c.amount)}</span>
            </div>
            <div className="row-between" style={{ fontSize:12,color:"var(--hint)" }}>
              <span>Used {c.used_count}/{c.max_uses}</span>
              <span>{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            {c.note && <div style={{ fontSize:12,color:"var(--hint)",marginTop:4 }}><FileText size={12} style={{display:"inline",verticalAlign:"-2px"}}/> {c.note}</div>}
            <div className="row" style={{ gap:8,marginTop:10 }}>
              <button className={`btn ${c.is_active?"btn-secondary":"btn-success"}`} style={{ flex:1,padding:"8px",fontSize:12 }} onClick={() => toggle(c)}>
                <Power size={13}/> {c.is_active?"Deactivate":"Activate"}
              </button>
              <button className="btn btn-danger" style={{ padding:"8px 12px" }} onClick={() => remove(c)}><Trash2 size={13}/></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
