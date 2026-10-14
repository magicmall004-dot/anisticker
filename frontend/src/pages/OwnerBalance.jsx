import { useState, useEffect } from "react";
import { Check, X, Plus, Minus, RefreshCw, ChevronDown, ChevronUp, Clock, Coins, Edit2 } from "lucide-react";
import { getTopupRequests, actionTopupRequest, getAllBalances, adjustBalance } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { hapticNotification, haptic, showConfirm } from "../lib/telegram";

export default function OwnerBalance() {
  const [tab, setTab] = useState("requests");
  return (
    <div className="page-body">
      <div className="scroll-row" style={{ marginBottom:4 }}>
        {["requests","balances","adjust"].map((t) => (
          <div key={t} className={`pill ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t==="requests" ? <><Clock size={13} style={{display:"inline",verticalAlign:"-2px"}}/> Top-Up Requests</> : t==="balances" ? <><Coins size={13} style={{display:"inline",verticalAlign:"-2px"}}/> User Balances</> : <><Edit2 size={13} style={{display:"inline",verticalAlign:"-2px"}}/> Manual Adjust</>}
          </div>
        ))}
      </div>
      {tab==="requests" && <TopupRequests />}
      {tab==="balances" && <UserBalances />}
      {tab==="adjust"   && <ManualAdjust />}
    </div>
  );
}

function TopupRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending");

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try { setRequests(await getTopupRequests(filter)); }
    finally { setLoading(false); }
  }

  async function action(id, act) {
    const confirmed = await showConfirm(`${act==="approve"?"Approve":"Reject"} this top-up request?`);
    if (!confirmed) return;
    try { await actionTopupRequest(id, act); hapticNotification("success"); load(); }
    catch (e) { hapticNotification("error"); alert("Failed: "+(e.response?.data?.detail||e.message)); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div className="scroll-row">
        {["pending","approved","rejected"].map((f) => (
          <div key={f} className={`pill ${filter===f?"active":""}`} onClick={() => setFilter(f)} style={{ fontSize:11 }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </div>
        ))}
        <button className="btn btn-ghost" style={{ padding:"4px 8px" }} onClick={load}>
          <RefreshCw size={14} className={loading?"refresh-spin":""} />
        </button>
      </div>
      {loading ? <div style={{ display:"flex",justifyContent:"center",padding:24 }}><div className="spinner" /></div>
      : requests.length===0 ? <div className="empty-state" style={{ padding:"24px 0" }}>No {filter} requests</div>
      : requests.map((tx) => (
        <div key={tx.id} className="card">
          <div className="row-between" style={{ marginBottom:8 }}>
            <div className="row" style={{ gap:8 }}>
              {tx.user?.photo_url && <img src={tx.user.photo_url} alt="" style={{ width:32,height:32,borderRadius:"50%",objectFit:"cover" }} />}
              <div>
                <div style={{ fontWeight:600,fontSize:13 }}>{tx.user?.first_name} {tx.user?.last_name}</div>
                {tx.user?.username && <div style={{ fontSize:11,color:"var(--hint)" }}>@{tx.user.username}</div>}
              </div>
            </div>
            <div style={{ fontWeight:800,fontSize:16,color:"var(--success)" }}>+{formatPrice(tx.amount)}</div>
          </div>
          <div style={{ fontSize:11,color:"var(--hint)",marginBottom:8 }}>{new Date(tx.created_at).toLocaleString()}</div>
          {tx.transaction_image_url && (
            <a href={tx.transaction_image_url} target="_blank" rel="noreferrer">
              <img src={tx.transaction_image_url} alt="receipt" style={{ width:"100%",maxHeight:160,objectFit:"cover",borderRadius:"var(--radius-sm)",marginBottom:8 }} />
            </a>
          )}
          {tx.status==="pending" && (
            <div className="row" style={{ gap:8,marginTop:4 }}>
              <button className="btn btn-success" style={{ flex:1,padding:"10px" }} onClick={() => action(tx.id,"approve")}><Check size={15} /> Approve</button>
              <button className="btn btn-danger"  style={{ flex:1,padding:"10px" }} onClick={() => action(tx.id,"reject")}><X size={15} /> Reject</button>
            </div>
          )}
          {tx.status!=="pending" && (
            <div style={{ fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:99,display:"inline-flex",alignItems:"center",gap:4,background:tx.status==="approved"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",color:tx.status==="approved"?"var(--success)":"var(--danger)" }}>
              {tx.status==="approved"?<Check size={11}/>:<X size={11}/>} {tx.status.charAt(0).toUpperCase()+tx.status.slice(1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UserBalances() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAllBalances().then(setUsers).finally(() => setLoading(false)); }, []);
  const total = users.reduce((s,u)=>s+Number(u.balance||0),0);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      <div className="card-glow" style={{ textAlign:"center" }}>
        <div style={{ fontSize:11,color:"var(--hint)" }}>Total Balance (All Users)</div>
        <div style={{ fontSize:22,fontWeight:800 }} className="glow-text">{formatPrice(total)}</div>
      </div>
      {loading ? <div style={{ display:"flex",justifyContent:"center",padding:24 }}><div className="spinner"/></div>
      : users.map((u) => (
        <div key={u.id} className="card">
          <div className="row-between">
            <div className="row" style={{ gap:8 }}>
              {u.photo_url && <img src={u.photo_url} alt="" style={{ width:32,height:32,borderRadius:"50%",objectFit:"cover" }} />}
              <div>
                <div style={{ fontWeight:600,fontSize:13 }}>{u.first_name} {u.last_name}</div>
                {u.username && <div style={{ fontSize:11,color:"var(--hint)" }}>@{u.username}</div>}
              </div>
            </div>
            <div style={{ fontWeight:800,fontSize:15,color:Number(u.balance)>0?"var(--success)":"var(--hint)" }}>{formatPrice(u.balance||0)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ManualAdjust() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [amount,   setAmount]   = useState("");
  const [type,     setType]     = useState("manual_add");
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => { getAllBalances().then(setUsers).finally(() => setLoading(false)); }, []);

  async function submit() {
    if (!selected||!amount||Number(amount)<=0) return;
    const confirmed = await showConfirm(`${type==="manual_add"?"Add":"Remove"} ${formatPrice(Number(amount))} ${type==="manual_add"?"to":"from"} ${selected.first_name}'s balance?`);
    if (!confirmed) return;
    setSaving(true);
    try {
      await adjustBalance({ user_id:selected.id, amount:Number(amount), type, note:note||null });
      hapticNotification("success");
      setAmount(""); setNote(""); setSelected(null);
      setUsers(await getAllBalances());
    } catch (e) { hapticNotification("error"); alert("Failed: "+(e.response?.data?.detail||e.message)); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      <div className="field">
        <div className="label">Select User</div>
        <div className="card" onClick={() => setShowList(!showList)} style={{ cursor:"pointer",padding:"12px 14px" }}>
          <div className="row-between">
            {selected ? (
              <div className="row" style={{ gap:8 }}>
                {selected.photo_url && <img src={selected.photo_url} alt="" style={{ width:28,height:28,borderRadius:"50%",objectFit:"cover" }} />}
                <div>
                  <div style={{ fontWeight:600 }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontSize:12,color:"var(--accent)" }}>Balance: {formatPrice(selected.balance||0)}</div>
                </div>
              </div>
            ) : <span style={{ color:"var(--hint)" }}>{loading?"Loading users…":"Tap to select user"}</span>}
            {showList ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </div>
        </div>
        {showList && (
          <div className="card" style={{ padding:0,overflow:"hidden",maxHeight:200,overflowY:"auto" }}>
            {users.map((u) => (
              <div key={u.id} onClick={() => { setSelected(u); setShowList(false); haptic("light"); }}
                style={{ padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.05)",background:selected?.id===u.id?"rgba(4,217,255,0.08)":"transparent" }}>
                <div className="row-between">
                  <span style={{ fontWeight:600,fontSize:13 }}>{u.first_name} {u.last_name}{u.username?` (@${u.username})`:""}</span>
                  <span style={{ fontSize:12,color:"var(--success)",fontWeight:700 }}>{formatPrice(u.balance||0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="row" style={{ gap:8 }}>
        <button className={`btn ${type==="manual_add"?"btn-success":"btn-secondary"} btn-full`} onClick={() => setType("manual_add")}><Plus size={15}/> Add</button>
        <button className={`btn ${type==="manual_remove"?"btn-danger":"btn-secondary"} btn-full`} onClick={() => setType("manual_remove")}><Minus size={15}/> Remove</button>
      </div>
      <div className="field">
        <div className="label">Amount (MMK)</div>
        <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" style={{ fontSize:18,fontWeight:700 }} />
      </div>
      <div className="field">
        <div className="label">Note (optional)</div>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Refund, Bonus" />
      </div>
      <button className="btn btn-primary btn-full" disabled={!selected||!amount||saving} onClick={submit} style={{ padding:14 }}>
        {saving ? "Saving…" : `${type==="manual_add"?"Add":"Remove"} Balance`}
      </button>
    </div>
  );
}
