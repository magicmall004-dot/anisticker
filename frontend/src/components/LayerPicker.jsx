import { useState, useEffect, useRef } from "react";
import { Plus, X, Check } from "lucide-react";
import { haptic } from "../lib/telegram";
import api from "../lib/api";

function extraRole(n) {
  return { id: `extra${n}`, label: `Extra Color ${n}`, hint: "Additional customizable color" };
}
const ROLES = [
  { id:"logo",      label:"Logo Color",      hint:"Unique color marking your logo group — users pick their logo/brand color" },
  { id:"primary",   label:"Primary Color",    hint:"Main brand/background color" },
  { id:"secondary", label:"Secondary Color",  hint:"Accent or secondary brand color" },
  { id:"extra1",    label:"Extra Color 1",    hint:"Additional replaceable color" },
  { id:"extra2",    label:"Extra Color 2",    hint:"Additional replaceable color" },
  { id:"extra3",    label:"Extra Color 3",    hint:"Additional replaceable color" },
];

function LottiePreview({ animData }) {
  const ref = useRef();
  const inst = useRef();
  useEffect(() => {
    if (!ref.current || !animData) return;
    ref.current.innerHTML = "";
    import("lottie-web").then(({ default: lottie }) => {
      try { inst.current?.destroy(); } catch(e){}
      inst.current = lottie.loadAnimation({
        container: ref.current, renderer:"svg",
        loop:true, autoplay:true,
        animationData: JSON.parse(JSON.stringify(animData)),
      });
    });
    return () => { try { inst.current?.destroy(); } catch(e){} };
  }, [animData]);
  return <div ref={ref} style={{ width:"100%", height:"100%" }}/>;
}

export default function LayerPicker({ fileUrl, colorMap, onColorMapChange, detectedColors }) {
  const [animData, setAnimData] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [newHex,      setNewHex]      = useState("#ff0000");
  const [newRole,     setNewRole]     = useState("logo");
  const [autoDetected,setAutoDetected]= useState(false);

  useEffect(() => {
    if (fileUrl?.endsWith(".tgs")) loadPreview();
  }, [fileUrl]);

  async function loadPreview() {
    setLoading(true);
    try {
      const r = await fetch(fileUrl);
      const buf = await r.arrayBuffer();
      const { default: pako } = await import('pako');
      setAnimData(JSON.parse(pako.inflate(new Uint8Array(buf), { to:'string' })));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function isAdded(hex) { return colorMap.some(c => c.original.toLowerCase() === hex.toLowerCase()); }

  function getNextRole() {
    const used = colorMap.map(c=>c.role);
    const baseFree = ROLES.find(r=>!used.includes(r.id));
    if (baseFree) return baseFree.id;
    let n = 1;
    while (used.includes(`extra${n}`)) n++;
    return `extra${n}`;
  }

  function quickAdd(hex) {
    if (isAdded(hex)) return;
    onColorMapChange([...colorMap, { original:hex.toLowerCase(), role:getNextRole() }]);
    haptic("light");
  }

  function addManual() {
    if (!newHex || isAdded(newHex)) return;
    onColorMapChange([...colorMap, { original:newHex.toLowerCase(), role:newRole }]);
    setShowAdd(false); haptic("light");
  }

  function updateRole(idx, role) {
    const u=[...colorMap]; u[idx]={...u[idx],role}; onColorMapChange(u);
  }

  function remove(idx) {
    onColorMapChange(colorMap.filter((_,i)=>i!==idx)); haptic("light");
  }

  if (!fileUrl?.endsWith(".tgs")) return null;

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

      {/* Preview */}
      <div style={{ background:"var(--bg)",borderRadius:"var(--radius)",border:"1px solid var(--border)",overflow:"hidden",aspectRatio:"1",width:200,margin:"0 auto" }}>
        {loading
          ? <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%" }}><div className="spinner"/></div>
          : animData ? <LottiePreview animData={animData}/> : null}
      </div>

      {/* Auto-detected config banner */}
      {autoDetected && (
        <div style={{ padding:"8px 10px",borderRadius:8,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",fontSize:11,color:"var(--success)",lineHeight:1.6 }}>
          ✅ <b>MagicMall config detected!</b><br/>
          Colors and slots auto-applied from embedded metadata.
        </div>
      )}

      {/* Auto-detected colors */}
      {detectedColors?.length > 0 && (
        <div>
          <div style={{ fontSize:12,color:"var(--hint)",marginBottom:6 }}>
            Colors found in TGS — tap to add:
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
            {detectedColors.map(c => {
              const added = isAdded(c);
              return (
                <div key={c} onClick={() => !added && quickAdd(c)}
                  style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:99,
                    cursor:added?"default":"pointer",transition:"all .15s",
                    background:added?"rgba(4,217,255,0.1)":"rgba(255,255,255,0.05)",
                    border:added?"1px solid rgba(4,217,255,0.3)":"1px solid rgba(255,255,255,0.1)",
                    opacity:added?0.5:1 }}>
                  <div style={{ width:14,height:14,borderRadius:"50%",background:c,border:"1.5px solid var(--border)" }}/>
                  <span style={{ fontSize:11,fontFamily:"monospace" }}>{c}</span>
                  {added && <span style={{ fontSize:10,color:"var(--accent)" }}><Check size={12}/></span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Color slots list */}
      {colorMap.length > 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          <div className="label">Color Slots ({colorMap.length})</div>
          {colorMap.map((c,i) => {
            const roleInfo = ROLES.find(r=>r.id===c.role) || (c.role?.startsWith("extra") ? extraRole(c.role.replace("extra","")) : ROLES[0]);
            return (
              <div key={i} style={{ borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--card)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px" }}>
                  <div style={{ width:28,height:28,borderRadius:7,background:c.original,border:"2px solid var(--border)",flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:13,fontFamily:"monospace" }}>{c.original}</div>
                    <div style={{ fontSize:11,color:"var(--accent)",fontWeight:600 }}>{roleInfo.label}</div>
                  </div>
                  <button onClick={() => remove(i)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--danger)",padding:4 }}>
                    <X size={13}/>
                  </button>
                </div>
                {/* Role picker */}
                <div style={{ display:"flex",flexWrap:"wrap",gap:4,padding:"0 10px 10px" }}>
                  {[...ROLES, extraRole((colorMap.filter(x=>x.role?.startsWith("extra")).length)+1)].map(r => (
                    <div key={r.id} onClick={() => updateRole(i,r.id)}
                      style={{ padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:600,cursor:"pointer",
                        background:c.role===r.id?"rgba(4,217,255,0.15)":"rgba(255,255,255,0.05)",
                        border:c.role===r.id?"1px solid rgba(4,217,255,0.4)":"1px solid rgba(255,255,255,0.08)",
                        color:c.role===r.id?"var(--accent)":"var(--hint)",transition:"all .15s" }}>
                      {r.label}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11,color:"var(--hint)",padding:"0 12px 10px",lineHeight:1.5 }}>
                  {roleInfo.hint}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add color */}
      {showAdd ? (
        <div style={{ background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)",padding:"12px" }}>
          <div style={{ fontSize:12,color:"var(--hint)",marginBottom:8 }}>
            Enter the exact color code you used in your TGS:
          </div>
          <div className="row" style={{ gap:8,marginBottom:10 }}>
            <input type="color" value={newHex} onChange={e=>setNewHex(e.target.value)}
              style={{ width:42,height:38,borderRadius:8,border:"none",cursor:"pointer",padding:2,flexShrink:0 }}/>
            <input className="input" value={newHex} onChange={e=>setNewHex(e.target.value)}
              style={{ flex:1,fontFamily:"monospace",fontSize:14 }} placeholder="#ff0000"/>
          </div>
          <div style={{ fontSize:12,color:"var(--hint)",marginBottom:6 }}>Role:</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:10 }}>
            {ROLES.map(r => (
              <div key={r.id} onClick={() => setNewRole(r.id)}
                style={{ padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:newRole===r.id?"rgba(4,217,255,0.15)":"rgba(255,255,255,0.05)",
                  border:newRole===r.id?"1px solid rgba(4,217,255,0.4)":"1px solid rgba(255,255,255,0.08)",
                  color:newRole===r.id?"var(--accent)":"var(--hint)" }}>
                {r.label}
              </div>
            ))}
          </div>
          <div className="row" style={{ gap:8 }}>
            <button className="btn btn-secondary" style={{ flex:1,padding:"9px" }} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex:2,padding:"9px" }} onClick={addManual}>Add Slot</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary btn-full" onClick={() => setShowAdd(true)} style={{ padding:"10px",fontSize:13 }}>
          <Plus size={14}/> Add Color Slot
        </button>
      )}

      {/* Instructions */}
      <div style={{ fontSize:11,color:"var(--hint)",lineHeight:1.8,padding:"10px 12px",borderRadius:8,background:"var(--card)",border:"1px solid var(--border)" }}>
        <b style={{color:"var(--text)"}}>Setup guide:</b><br/>
        • Use <b>unique color codes</b> in your TGS for each replaceable zone<br/>
        • <b>Logo Color</b> — unique color used for logo group shapes<br/>
        • <b>Primary/Secondary</b> — brand colors user can customize<br/>
        • <b>Extra</b> — any additional color zones<br/>
        • Users pick their colors at order → auto-processes + delivers instantly ⚡
      </div>
    </div>
  );
}
