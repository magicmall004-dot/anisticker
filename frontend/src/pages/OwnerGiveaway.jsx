import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, Sparkles, Trophy, X, Coins, Palette, Film } from "lucide-react";
import { getGiveaways, createGiveaway, drawGiveaway, deleteGiveaway, getDesigns, uploadDesignFile } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { hapticNotification, haptic, showConfirm } from "../lib/telegram";
import AnimationPreview from "../components/AnimationPreview";

export default function OwnerGiveaway() {
  const [giveaways, setGiveaways] = useState([]);
  const [designs,   setDesigns]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);

  useEffect(() => {
    Promise.all([getGiveaways(), getDesigns({ show_hidden:true })])
      .then(([g,d]) => { setGiveaways(g); setDesigns(d); })
      .finally(() => setLoading(false));
  }, []);

  async function reload() { setGiveaways(await getGiveaways()); }

  async function handleDraw(g) {
    const ok = await showConfirm(`Draw winners for "${g.title}" now? This cannot be undone.`);
    if (!ok) return;
    try { const res=await drawGiveaway(g.id); hapticNotification("success"); alert(`Drew ${res.winners.length} winner(s)!`); reload(); }
    catch (e) { alert("Failed: "+(e.response?.data?.detail||e.message)); }
  }

  async function handleDelete(g) {
    const ok = await showConfirm(`Delete giveaway "${g.title}"?`);
    if (!ok) return;
    await deleteGiveaway(g.id); hapticNotification("success"); reload();
  }

  if (showForm) return <GiveawayForm designs={designs} onBack={() => setShowForm(false)} onCreated={() => { setShowForm(false); reload(); }}/>;

  return (
    <div className="page-body">
      <button className="btn btn-primary btn-full" onClick={() => setShowForm(true)} style={{ padding:14 }}><Plus size={16}/> Create Giveaway</button>
      <div className="section-title">All Giveaways</div>
      {loading ? <div style={{ display:"flex",justifyContent:"center",padding:24 }}><div className="spinner"/></div>
      : giveaways.length===0 ? <div className="empty-state" style={{ padding:"24px 0" }}><Trophy size={32}/><div>No giveaways yet</div></div>
      : giveaways.map((g) => (
        <div key={g.id} className="card" style={{ border:g.status==="active"?"1px solid rgba(var(--accent2-rgb),0.3)":"1px solid rgba(255,255,255,0.07)" }}>
          <div className="row-between" style={{ marginBottom:8 }}>
            <div className="row" style={{ gap:10 }}>
              {g.tgs_url && <AnimationPreview url={g.tgs_url} fileType={g.tgs_url.endsWith("tgs")?"tgs":"json"} size="36px" autoplay loop/>}
              <div>
                <div style={{ fontWeight:700,fontSize:14 }}>{g.title}</div>
                <div style={{ fontSize:11,color:"var(--hint)" }}>{g.participant_count} joined · {g.winner_count} winner{g.winner_count>1?"s":""}</div>
              </div>
            </div>
            <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:g.status==="active"?"rgba(var(--accent2-rgb),0.15)":g.status==="drawn"?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)",color:g.status==="active"?"#a78bfa":g.status==="drawn"?"var(--success)":"var(--danger)" }}>{g.status}</span>
          </div>
          <div style={{ fontSize:12,color:"var(--hint)",marginBottom:8 }}>
            {g.prize_type==="cash"?`💰 ${g.cash_mode==="exact"?`${formatPrice(g.prize_amount)} each`:`${formatPrice(g.prize_amount)} split`}`:`🎨 ${g.design_ids?.length||0} design(s) in pool`}
          </div>
          <div className="row" style={{ gap:8 }}>
            {g.status==="active" && <button className="btn btn-success" style={{ flex:1,padding:"8px",fontSize:12 }} onClick={() => handleDraw(g)}><Sparkles size={13}/> Draw Now</button>}
            <button className="btn btn-danger" style={{ padding:"8px 12px" }} onClick={() => handleDelete(g)}><Trash2 size={13}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GiveawayForm({ designs, onBack, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tgsUrl, setTgsUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [durationValue, setDurationValue] = useState("24");
  const [durationUnit, setDurationUnit] = useState("hours");
  const [winnerCount, setWinnerCount] = useState("1");
  const [prizeType, setPrizeType] = useState("cash");
  const [cashMode, setCashMode] = useState("split");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [selectedDesigns, setSelectedDesigns] = useState([]);
  const [creating, setCreating] = useState(false);

  async function handleUpload(file) {
    setUploading(true);
    try { const res=await uploadDesignFile(file); setTgsUrl(res.url); }
    catch (e) { alert("Upload failed"); }
    finally { setUploading(false); }
  }

  const designsNeeded = prizeType==="design" ? Number(winnerCount)||1 : 0;
  const canSubmit = title.trim() && Number(durationValue)>0 && Number(winnerCount)>0 &&
    (prizeType==="cash" ? Number(prizeAmount)>0 : selectedDesigns.length>=designsNeeded);

  async function submit() {
    setCreating(true);
    try {
      const hours = durationUnit==="days"?Number(durationValue)*24:durationUnit==="minutes"?Number(durationValue)/60:Number(durationValue);
      await createGiveaway({ title:title.trim(), description:description.trim()||null, tgs_url:tgsUrl||null, duration_hours:hours, winner_count:Number(winnerCount), prize_type:prizeType, cash_mode:prizeType==="cash"?cashMode:null, prize_amount:prizeType==="cash"?Number(prizeAmount):0, design_ids:prizeType==="design"?selectedDesigns:[] });
      hapticNotification("success"); onCreated();
    } catch (e) { alert("Failed: "+(e.response?.data?.detail||e.message)); }
    finally { setCreating(false); }
  }

  return (
    <div className="page-body">
      <div className="row-between"><div style={{ fontWeight:700,fontSize:16 }}>New Giveaway</div><button className="btn btn-ghost" style={{ padding:4 }} onClick={onBack}><X size={14}/></button></div>
      <div className="field"><div className="label">Title</div><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Christmas Giveaway 🎄"/></div>
      <div className="field"><div className="label">Description (optional)</div><textarea className="input" rows={2} style={{ resize:"none" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell users about this giveaway..."/></div>
      <div className="field">
        <div className="label">Animation (.tgs or .json)</div>
        <div className="row" style={{ gap:10 }}>
          {tgsUrl && <AnimationPreview url={tgsUrl} fileType={tgsUrl.endsWith("tgs")?"tgs":"json"} size="44px" autoplay loop/>}
          <input type="file" accept=".tgs,.json" style={{ display:"none" }} id="giveaway-tgs" onChange={(e) => e.target.files?.[0]&&handleUpload(e.target.files[0])}/>
          <button className="btn btn-secondary" style={{ fontSize:12,padding:"8px 12px" }} disabled={uploading} onClick={() => document.getElementById("giveaway-tgs").click()}>
            <Upload size={13}/> {uploading?"Uploading…":"Upload"}
          </button>
        </div>
      </div>
      <div className="row" style={{ gap:8 }}>
        <div className="field" style={{ flex:1 }}><div className="label">Duration</div><input className="input" type="number" min="1" value={durationValue} onChange={(e) => setDurationValue(e.target.value)}/></div>
        <div className="field" style={{ flex:1 }}><div className="label">Unit</div>
          <select className="input" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}>
            <option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
          </select>
        </div>
      </div>
      <div className="field"><div className="label">Number of Winners</div><input className="input" type="number" min="1" value={winnerCount} onChange={(e) => setWinnerCount(e.target.value)}/></div>
      <div className="field">
        <div className="label">Prize Type</div>
        <div className="row" style={{ gap:8 }}>
          <button className={`btn ${prizeType==="cash"?"btn-primary":"btn-secondary"} btn-full`} onClick={() => setPrizeType("cash")}><Coins size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Cash</button>
          <button className={`btn ${prizeType==="design"?"btn-primary":"btn-secondary"} btn-full`} onClick={() => setPrizeType("design")}><Palette size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Free Design</button>
        </div>
      </div>
      {prizeType==="cash" && (
        <>
          <div className="field">
            <div className="label">Prize Mode</div>
            <div className="row" style={{ gap:8 }}>
              <button className={`btn ${cashMode==="exact"?"btn-primary":"btn-secondary"} btn-full`} style={{ fontSize:12 }} onClick={() => setCashMode("exact")}>Exact (each wins full)</button>
              <button className={`btn ${cashMode==="split"?"btn-primary":"btn-secondary"} btn-full`} style={{ fontSize:12 }} onClick={() => setCashMode("split")}>Split (pool divided)</button>
            </div>
          </div>
          <div className="field"><div className="label">{cashMode==="exact"?"Amount per winner":"Total prize pool"} (MMK)</div><input className="input" type="number" min="1" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} placeholder="e.g. 5000"/></div>
          {cashMode==="split"&&Number(prizeAmount)>0&&Number(winnerCount)>0&&<div style={{ fontSize:12,color:"var(--success)" }}>Each winner gets ≈ {formatPrice(Number(prizeAmount)/Number(winnerCount))}</div>}
        </>
      )}
      {prizeType==="design" && (
        <div className="field">
          <div className="label">Select Designs ({selectedDesigns.length}/{designsNeeded} needed)</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10 }}>
            {designs.map((d) => (
              <div key={d.id} onClick={() => setSelectedDesigns((p) => [...p, d.id])} style={{ aspectRatio:"1",borderRadius:8,overflow:"hidden",cursor:"pointer",background:"var(--card)",border:"1.5px solid var(--border)" }}>
                {d.file_url ? <AnimationPreview url={d.file_url} fileType={d.file_type} size="100%" autoplay loop/> : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}><Film size={16}/></div>}
              </div>
            ))}
          </div>
          {selectedDesigns.length>0 && (
            <div>
              <div className="label">Prize Pool ({selectedDesigns.length})</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {selectedDesigns.map((id,idx) => {
                  const d=designs.find(x=>x.id===id);
                  return <div key={idx} onClick={() => setSelectedDesigns((p) => p.filter((_,i)=>i!==idx))} style={{ width:40,height:40,borderRadius:8,overflow:"hidden",cursor:"pointer",border:"1.5px solid var(--accent)" }}>
                    {d?.file_url?<AnimationPreview url={d.file_url} fileType={d.file_type} size="40px" autoplay loop/>:"🎞"}
                  </div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <button className="btn btn-primary btn-full" disabled={!canSubmit||creating} onClick={submit} style={{ padding:14,marginTop:8 }}>
        {creating?"Creating…":"🎉 Launch Giveaway"}
      </button>
    </div>
  );
}
