import { useState, useEffect } from "react";
import { Send, Users, Eye, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import api from "../lib/api";
import { hapticNotification, haptic, showConfirm } from "../lib/telegram";

const VARIABLES = [
  { key:"{first_name}", desc:"First name" },
  { key:"{username}",   desc:"@username" },
  { key:"{balance}",    desc:"Balance" },
  { key:"{app_url}",    desc:"Mini App URL" },
];

export default function OwnerBroadcast() {
  const [text,      setText]      = useState("");
  const [target,    setTarget]    = useState("all");
  const [sending,   setSending]   = useState(false);
  const [preview,   setPreview]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    api.get("/broadcast/count", { params:{ target } }).then(r => setUserCount(r.data.count)).catch(()=>{});
  }, [target]);

  function insertVar(v) {
    const ta = document.getElementById("broadcast-text");
    if (ta) {
      const s=ta.selectionStart, e=ta.selectionEnd;
      setText(text.slice(0,s)+v+text.slice(e));
      setTimeout(()=>{ ta.selectionStart=ta.selectionEnd=s+v.length; ta.focus(); },10);
    } else setText(t=>t+v);
    haptic("light");
  }

  function getPreview() {
    return text
      .replace(/{first_name}/g, "FLAME")
      .replace(/{username}/g, "@Magic_Mall_GameShop")
      .replace(/{balance}/g, "5,000")
      .replace(/{app_url}/g, "t.me/MagicMallEmojiOrderBot");
  }

  async function send() {
    if (!text.trim()) return;
    const ok = await showConfirm(`Send this message to ${userCount||"all"} ${target==="all"?"users":target+"s"}?\n\nThis cannot be undone.`);
    if (!ok) return;
    setSending(true); setResult(null);
    try {
      const res = await api.post("/broadcast/send", { text, target });
      hapticNotification("success");
      setResult({ success:true, sent:res.data.sent, failed:res.data.failed });
    } catch(e) {
      hapticNotification("error");
      setResult({ success:false, error:e.response?.data?.detail||e.message });
    } finally { setSending(false); }
  }

  return (
    <div className="page-body">
      <div className="card-glow">
        <div style={{fontWeight:700,marginBottom:4}}>Broadcast Message</div>
        <div style={{fontSize:12,color:"var(--hint)"}}>Send a message to all or selected users via Telegram bot.</div>
      </div>

      {/* Target */}
      <div>
        <div className="label" style={{marginBottom:6}}>Send To</div>
        <div className="row" style={{gap:8}}>
          {[["all","All Users"],["reseller","Resellers"],["user","Customers"]].map(([v,l]) => (
            <button key={v} onClick={()=>setTarget(v)}
              className={`btn ${target===v?"btn-primary":"btn-secondary"} btn-full`}
              style={{fontSize:12,padding:"9px"}}>
              {l}
            </button>
          ))}
        </div>
        {userCount !== null && (
          <div style={{fontSize:12,color:"var(--accent)",marginTop:6,display:"flex",alignItems:"center",gap:4}}>
            <Users size={12}/> {userCount} users will receive this message
          </div>
        )}
      </div>

      {/* Variables */}
      <div>
        <div className="label" style={{marginBottom:6}}>Insert Variable</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {VARIABLES.map(v => (
            <div key={v.key} onClick={() => insertVar(v.key)} title={v.desc}
              style={{padding:"3px 8px",borderRadius:6,background:"rgba(var(--accent-rgb),0.1)",border:"1px solid rgba(var(--accent-rgb),0.2)",fontSize:11,fontFamily:"monospace",color:"var(--accent)",cursor:"pointer",fontWeight:600}}>
              {v.key}
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="field">
        <div className="label">Message (HTML supported)</div>
        <textarea id="broadcast-text" className="input" rows={6}
          style={{resize:"vertical",fontFamily:"monospace",fontSize:12,lineHeight:1.6}}
          value={text} onChange={e=>setText(e.target.value)}
          placeholder="Hello {first_name}! 👋&#10;&#10;We have a new update for you..."/>
      </div>

      {/* Preview */}
      {text && (
        <div>
          <button className="btn btn-secondary btn-full" style={{fontSize:12,padding:"8px"}} onClick={()=>setPreview(p=>!p)}>
            <Eye size={13}/> {preview?"Hide":"Show"} Preview
          </button>
          {preview && (
            <div style={{background:"var(--bg)",borderRadius:8,padding:"12px",border:"1px solid var(--border)",marginTop:8}}>
              <div style={{fontSize:10,color:"var(--hint)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Preview (sample user)</div>
              <div style={{fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}
                dangerouslySetInnerHTML={{__html:getPreview().replace(/\n/g,"<br/>")}}/>
            </div>
          )}
        </div>
      )}

      {/* Warning */}
      <div style={{display:"flex",gap:8,padding:"10px 12px",borderRadius:8,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
        <AlertCircle size={16} color="var(--warning)" style={{flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:"var(--warning)",lineHeight:1.6}}>
          Broadcast sends to all selected users at once. Be careful — too many messages may trigger Telegram spam limits.
        </div>
      </div>

      {/* Result */}
      {result && (
        <div style={{padding:"10px 12px",borderRadius:8,background:result.success?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${result.success?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`}}>
          {result.success
            ? <div style={{color:"var(--success)",fontSize:13}}><CheckCircle size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Sent to {result.sent} users{result.failed>0?` (${result.failed} failed)`:""}</div>
            : <div style={{color:"var(--danger)",fontSize:13}}><XCircle size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Failed: {result.error}</div>}
        </div>
      )}

      <button className="btn btn-primary btn-full" disabled={!text.trim()||sending} onClick={send} style={{padding:14}}>
        {sending ? "Sending…" : <><Send size={15}/> Send Broadcast</>}
      </button>
    </div>
  );
}
