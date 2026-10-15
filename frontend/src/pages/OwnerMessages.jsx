import { useState, useEffect } from "react";
import { Save, Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import api from "../lib/api";
import { hapticNotification, haptic } from "../lib/telegram";

const VARIABLES = [
  { key:"{first_name}",  desc:"Customer first name" },
  { key:"{username}",    desc:"@username" },
  { key:"{amount}",      desc:"Amount in MMK" },
  { key:"{order_id}",    desc:"Order ID (short)" },
  { key:"{design_id}",   desc:"Design custom ID" },
  { key:"{designs}",     desc:"Design names list" },
  { key:"{balance}",     desc:"User balance" },
  { key:"{status}",      desc:"Order status" },
  { key:"{app_url}",     desc:"Mini App URL" },
];

const BUTTON_STYLES = ["primary","success","danger","transparent"];

export default function OwnerMessages() {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [preview,  setPreview]  = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/bot-messages/");
      setMessages(res.data);
    } finally { setLoading(false); }
  }

  async function save(msg) {
    setSaving(msg.id);
    try {
      await api.put(`/bot-messages/${msg.id}`, msg);
      hapticNotification("success");
      setMessages(prev => prev.map(m => m.id===msg.id ? msg : m));
    } catch(e) { alert("Failed: " + (e.response?.data?.detail||e.message)); }
    finally { setSaving(null); }
  }

  function updateMsg(id, patch) {
    setMessages(prev => prev.map(m => m.id===id ? {...m,...patch} : m));
  }

  function addButton(msgId) {
    const msg = messages.find(m=>m.id===msgId);
    const buttons = [...(msg.buttons||[]), { text:"Button", url:"", callback:"", style:"primary" }];
    updateMsg(msgId, { buttons });
    haptic("light");
  }

  function removeButton(msgId, idx) {
    const msg = messages.find(m=>m.id===msgId);
    updateMsg(msgId, { buttons: msg.buttons.filter((_,i)=>i!==idx) });
  }

  function updateButton(msgId, idx, patch) {
    const msg = messages.find(m=>m.id===msgId);
    const buttons = msg.buttons.map((b,i) => i===idx ? {...b,...patch} : b);
    updateMsg(msgId, { buttons });
  }

  function insertVar(msgId, variable) {
    const msg = messages.find(m=>m.id===msgId);
    const textarea = document.getElementById(`msg-text-${msgId}`);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = msg.text.slice(0,start) + variable + msg.text.slice(end);
      updateMsg(msgId, { text: newText });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 10);
    } else {
      updateMsg(msgId, { text: msg.text + variable });
    }
    haptic("light");
  }

  function getPreview(msg) {
    let text = msg.text
      .replace(/{first_name}/g, "FLAME")
      .replace(/{username}/g, "@Magic_Mall_GameShop")
      .replace(/{amount}/g, "2,000")
      .replace(/{order_id}/g, "ab1234cd")
      .replace(/{designs}/g, "Design #100001, Design #100002")
      .replace(/{balance}/g, "5,000")
      .replace(/{status}/g, "accepted")
      .replace(/{app_url}/g, "t.me/MagicMallEmojiOrderBot");
    return text;
  }

  if (loading) return <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>;

  return (
    <div className="page-body">
      <div className="card-glow" style={{marginBottom:4}}>
        <div style={{fontWeight:700,marginBottom:4}}>Bot Message Templates</div>
        <div style={{fontSize:12,color:"var(--hint)"}}>Customize all bot messages with variables, rich text and buttons.</div>
      </div>

      {messages.map(msg => (
        <div key={msg.id} className="card" style={{padding:0,overflow:"hidden"}}>
          {/* Header */}
          <div className="row-between" style={{padding:"12px 14px",cursor:"pointer",borderBottom:expanded===msg.id?"1px solid rgba(255,255,255,0.07)":"none"}}
            onClick={() => {haptic("light"); setExpanded(expanded===msg.id?null:msg.id);}}>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{msg.name}</div>
              <div style={{fontSize:11,color:"var(--hint)",fontFamily:"monospace",marginTop:2}}>{msg.id}</div>
            </div>
            <div className="row" style={{gap:8}}>
              <div style={{fontSize:11,color:"var(--hint)"}}>{(msg.buttons||[]).length} btn{(msg.buttons||[]).length!==1?"s":""}</div>
              {expanded===msg.id ? <ChevronUp size={16} color="var(--hint)"/> : <ChevronDown size={16} color="var(--hint)"/>}
            </div>
          </div>

          {expanded===msg.id && (
            <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>

              {/* Variable chips */}
              <div>
                <div style={{fontSize:11,color:"var(--hint)",marginBottom:6}}>Tap to insert variable:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {VARIABLES.map(v => (
                    <div key={v.key} onClick={() => insertVar(msg.id, v.key)}
                      title={v.desc}
                      style={{padding:"3px 8px",borderRadius:6,background:"rgba(var(--accent-rgb),0.1)",border:"1px solid rgba(var(--accent-rgb),0.2)",fontSize:11,fontFamily:"monospace",color:"var(--accent)",cursor:"pointer",fontWeight:600}}>
                      {v.key}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message text */}
              <div className="field">
                <div className="label">Message Text (HTML supported)</div>
                <textarea id={`msg-text-${msg.id}`} className="input" rows={6}
                  style={{resize:"vertical",fontFamily:"monospace",fontSize:12,lineHeight:1.6}}
                  value={msg.text}
                  onChange={e => updateMsg(msg.id, {text:e.target.value})}/>
              </div>

              {/* Preview */}
              <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
                <div style={{fontSize:10,color:"var(--hint)",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Preview</div>
                <div style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",color:"var(--text)"}}
                  dangerouslySetInnerHTML={{__html: getPreview(msg).replace(/\n/g,"<br/>")}}/>
              </div>

              {/* Buttons */}
              <div>
                <div className="row-between" style={{marginBottom:8}}>
                  <div className="label">Buttons</div>
                  <button className="btn btn-secondary" style={{fontSize:11,padding:"4px 10px"}} onClick={() => addButton(msg.id)}>
                    <Plus size={12}/> Add Button
                  </button>
                </div>
                {(msg.buttons||[]).map((btn,idx) => (
                  <div key={idx} style={{background:"var(--card)",borderRadius:8,border:"1px solid var(--border)",padding:"10px 12px",marginBottom:8}}>
                    <div className="row-between" style={{marginBottom:8}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--hint)"}}>Button {idx+1}</div>
                      <button onClick={() => removeButton(msg.id,idx)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--danger)",padding:2}}>
                        <X size={13}/>
                      </button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div className="field">
                        <div className="label">Button Text</div>
                        <input className="input" value={btn.text} onChange={e=>updateButton(msg.id,idx,{text:e.target.value})} placeholder="e.g. View Order"/>
                      </div>
                      <div className="field">
                        <div className="label">URL (leave empty for callback)</div>
                        <input className="input" value={btn.url||""} onChange={e=>updateButton(msg.id,idx,{url:e.target.value})} placeholder="https://t.me/...  or  {app_url}"/>
                      </div>
                      {!btn.url && (
                        <div className="field">
                          <div className="label">Callback Data</div>
                          <input className="input" style={{fontFamily:"monospace",fontSize:12}} value={btn.callback||""} onChange={e=>updateButton(msg.id,idx,{callback:e.target.value})} placeholder="order:accept:{order_id}"/>
                        </div>
                      )}
                      <div className="field">
                        <div className="label">Style</div>
                        <div className="row" style={{gap:6,flexWrap:"wrap"}}>
                          {BUTTON_STYLES.map(s => (
                            <div key={s} onClick={() => updateButton(msg.id,idx,{style:s})}
                              style={{padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",
                                background:btn.style===s?"rgba(var(--accent-rgb),0.15)":"rgba(255,255,255,0.05)",
                                border:btn.style===s?"1px solid rgba(var(--accent-rgb),0.4)":"1px solid rgba(255,255,255,0.08)",
                                color:btn.style===s?"var(--accent)":"var(--hint)"}}>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom emoji tip */}
              <div style={{background:"var(--card)",borderRadius:8,border:"1px solid var(--border)",padding:"10px 12px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--accent)",marginBottom:4}}>Custom Emoji</div>
                <div style={{fontSize:11,color:"var(--hint)",lineHeight:1.7}}>
                  Use: <code style={{background:"var(--bg)",padding:"1px 4px",borderRadius:4,fontSize:10}}>&lt;tg-emoji emoji-id="ID"&gt;⭐&lt;/tg-emoji&gt;</code><br/>
                  Get IDs: send emoji to <b>@getidsbot</b> in Telegram<br/>
                  Fallback text shown on unsupported clients
                </div>
                <button onClick={() => {
                  const snippet = '<tg-emoji emoji-id="EMOJI_ID">⭐</tg-emoji>';
                  const ta = document.getElementById(`msg-text-${msg.id}`);
                  if (ta) {
                    const s=ta.selectionStart, e=ta.selectionEnd;
                    const newText = msg.text.slice(0,s)+snippet+msg.text.slice(e);
                    updateMsg(msg.id,{text:newText});
                  }
                  haptic("light");
                }} className="btn btn-secondary" style={{fontSize:11,padding:"5px 10px",marginTop:6}}>
                  Insert Custom Emoji
                </button>
              </div>

              <div className="row" style={{gap:8}}>
                <button className="btn btn-secondary" style={{flex:1,padding:10,fontSize:12}} onClick={() => {
                  const ok = window.confirm("Reset this message to default?");
                  if (!ok) return;
                  const defaults = {
                    "order_new_owner": {text:"🛒 <b>New Order!</b>\n\n👤 {first_name} ({username})\n💰 {amount} MMK\n🎨 {designs}\n🆔 <code>{order_id}</code>", buttons:[{text:"✅ Accept",callback:"order:accept:{order_id}",style:"success"},{text:"❌ Cancel",callback:"order:cancel:{order_id}",style:"danger"}]},
                    "order_accepted": {text:"✅ Your order has been <b>accepted</b>!\n\nWe are working on your animated emoji pack soon! 🎨", buttons:[{text:"📦 My Orders",url:"{app_url}",style:"primary"}]},
                    "order_done": {text:"🎉 Your animated emoji pack is <b>ready</b>!\n\nCheck your Telegram messages for the files. 📁", buttons:[{text:"📦 My Orders",url:"{app_url}",style:"primary"}]},
                    "order_cancelled": {text:"❌ Your order has been <b>cancelled</b>.\n\nYour balance of {amount} MMK has been refunded. 💰", buttons:[{text:"🛍 Shop Again",url:"{app_url}",style:"primary"}]},
                  };
                  const dflt = defaults[msg.id];
                  if (dflt) { updateMsg(msg.id, dflt); haptic("light"); }
                }}>
                  Reset Default
                </button>
                <button className="btn btn-primary" style={{flex:2,padding:10}} disabled={saving===msg.id} onClick={() => save(msg)}>
                  {saving===msg.id ? "Saving…" : <><Save size={14}/> Save Message</>}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
