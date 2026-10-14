import { useState, useEffect, useRef } from "react";
import { Save, RefreshCw, Home, Upload, X, Wrench } from "lucide-react";
import { cloudSet, cloudGet, getStoredEmojiId, setStoredEmojiId, DEFAULT_EMOJI_ID, hapticNotification, addToHomeScreen } from "../lib/telegram";
import { getAppSettings, updateAppSettings, uploadDesignFile, uploadSettingFile } from "../lib/api";
import AnimationPreview from "../components/AnimationPreview";

export default function OwnerSettings() {
  const [emojiId,    setEmojiId]    = useState(getStoredEmojiId());
  const [channelUrl, setChannelUrl] = useState("");
  const [saved,      setSaved]      = useState(false);
  const [requiredChannel,   setRequiredChannel]   = useState("");
  const [requiredChannelId, setRequiredChannelId] = useState("");
  const [maintenance, setMaintenance] = useState({ maintenance_mode:"false", maintenance_message:"We are currently under maintenance. Please check back soon!", maintenance_tgs:"" });
  const [savingMaint, setSavingMaint] = useState(false);
  const [tgsUrls, setTgsUrls] = useState({
    tgs_new_badge:"", tgs_done:"", tgs_pending:"", tgs_owner_badge:"",
    tgs_reseller_badge:"", tgs_trophy:"", tgs_star:"", tgs_rank1:"", tgs_rank2:"", tgs_rank3:"",
    tgs_empty_state:"", tgs_loading:"",
    tgs_tier_bronze:"", tgs_tier_silver:"", tgs_tier_gold:"", tgs_tier_platinum:"",
  });
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    cloudGet("mm_emoji_id").then((val) => { if (val) { setEmojiId(val); setStoredEmojiId(val); } });
    getAppSettings().then((s) => {
      setChannelUrl(s.channel_url||"");
      setRequiredChannel(s.required_channel||"");
      setRequiredChannelId(s.required_channel_id||"");
      if (s.emoji_id) { setEmojiId(s.emoji_id); setStoredEmojiId(s.emoji_id); }
      setMaintenance({ maintenance_mode:s.maintenance_mode||"false", maintenance_message:s.maintenance_message||"We are currently under maintenance.", maintenance_tgs:s.maintenance_tgs||"" });
      setTgsUrls({
        tgs_new_badge:s.tgs_new_badge||"", tgs_done:s.tgs_done||"", tgs_pending:s.tgs_pending||"",
        tgs_owner_badge:s.tgs_owner_badge||"", tgs_reseller_badge:s.tgs_reseller_badge||"",
        tgs_trophy:s.tgs_trophy||"", tgs_star:s.tgs_star||"", tgs_rank1:s.tgs_rank1||"",
        tgs_rank2:s.tgs_rank2||"", tgs_rank3:s.tgs_rank3||"", tgs_empty_state:s.tgs_empty_state||"",
        tgs_loading:s.tgs_loading||"",
        tgs_tier_bronze:s.tgs_tier_bronze||"", tgs_tier_silver:s.tgs_tier_silver||"",
        tgs_tier_gold:s.tgs_tier_gold||"", tgs_tier_platinum:s.tgs_tier_platinum||"",
      });
    });
  }, []);

  async function save() {
    const id = emojiId.trim()||DEFAULT_EMOJI_ID;
    setStoredEmojiId(id);
    await cloudSet("mm_emoji_id", id);
    await updateAppSettings({ emoji_id:id, channel_url:channelUrl.trim(), required_channel:requiredChannel.trim(), required_channel_id:requiredChannelId.trim(), ...tgsUrls });
    hapticNotification("success");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page-body">
      <div className="section-title"><Wrench size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Maintenance Mode</div>
      <div className="card" style={{ border:maintenance.maintenance_mode==="true"?"1px solid rgba(239,68,68,0.4)":"1px solid rgba(255,255,255,0.07)" }}>
        <div className="row-between" style={{ marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:600 }}>Maintenance Mode</div>
            <div style={{ fontSize:12,color:"var(--hint)" }}>Only you (owner) can access the app</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={maintenance.maintenance_mode==="true"} onChange={(e) => setMaintenance(m=>({...m,maintenance_mode:e.target.checked?"true":"false"}))}/>
            <div className="toggle-track"/><div className="toggle-thumb"/>
          </label>
        </div>
        <div className="field">
          <div className="label">Message to users</div>
          <textarea className="input" rows={3} value={maintenance.maintenance_message} onChange={(e) => setMaintenance(m=>({...m,maintenance_message:e.target.value}))} style={{ resize:"none" }}/>
        </div>
        <div className="field" style={{ marginTop:8 }}>
          <div className="label">Animation (.tgs or .json)</div>
          <div className="row" style={{ gap:8 }}>
            {maintenance.maintenance_tgs && <AnimationPreview url={maintenance.maintenance_tgs} fileType={maintenance.maintenance_tgs.endsWith("tgs")?"tgs":"json"} size="48px" autoplay loop/>}
            <input type="file" accept=".tgs,.json" style={{ display:"none" }} id="maint-tgs"
              onChange={async (e) => { const file=e.target.files?.[0]; if(!file) return; try { const res=await uploadDesignFile(file); setMaintenance(m=>({...m,maintenance_tgs:res.url})); } catch(e){alert("Upload failed");} }}/>
            <button className="btn btn-secondary" style={{ fontSize:12,padding:"8px 12px" }} onClick={() => document.getElementById("maint-tgs").click()}>
              <Upload size={14}/> Upload Animation
            </button>
            {maintenance.maintenance_tgs && <button className="btn btn-ghost" style={{ padding:"8px" }} onClick={() => setMaintenance(m=>({...m,maintenance_tgs:""}))}><X size={14}/></button>}
          </div>
        </div>
        <button className="btn btn-primary btn-full" style={{ marginTop:12 }} disabled={savingMaint}
          onClick={async () => { setSavingMaint(true); try { await updateAppSettings(maintenance); hapticNotification("success"); } catch(e){alert("Failed");} finally{setSavingMaint(false);} }}>
          {savingMaint?"Saving…":maintenance.maintenance_mode==="true"?"🔴 Save (Maintenance ON)":"💚 Save (Maintenance OFF)"}
        </button>
      </div>

      <div className="section-title">UI Animations (.tgs)</div>
      <div className="card">
        <div style={{ fontSize:12,color:"var(--hint)",marginBottom:12 }}>Upload .tgs or .json animation files for UI elements.</div>
        {[
          { key:"tgs_new_badge", label:"NEW Badge", default:"✨" },
          { key:"tgs_done", label:"Order Done", default:"✅" },
          { key:"tgs_pending", label:"Order Pending", default:"⏳" },
          { key:"tgs_owner_badge", label:"Owner Badge", default:"👑" },
          { key:"tgs_reseller_badge", label:"Reseller Badge", default:"⭐" },
          { key:"tgs_trophy", label:"Leaderboard Trophy", default:"🏆" },
          { key:"tgs_star", label:"Star / Rating (rank 4+)", default:"⭐" },
          { key:"tgs_rank1", label:"Rank #1 Medal", default:"🥇" },
          { key:"tgs_rank2", label:"Rank #2 Medal", default:"🥈" },
          { key:"tgs_rank3", label:"Rank #3 Medal", default:"🥉" },
          { key:"tgs_empty_state", label:"No Designs (empty state)", default:"🎞" },
          { key:"tgs_loading", label:"Loading Spinner", default:"⏳" },
          { key:"tgs_tier_bronze", label:"Loyalty Tier: Bronze", default:"🥉" },
          { key:"tgs_tier_silver", label:"Loyalty Tier: Silver", default:"🥈" },
          { key:"tgs_tier_gold", label:"Loyalty Tier: Gold", default:"🥇" },
          { key:"tgs_tier_platinum", label:"Loyalty Tier: Platinum", default:"💎" },
        ].map(({ key, label, default: def }) => (
          <TgsUploadRow key={key} label={label} defaultEmoji={def}
            url={tgsUrls[key]}
            uploading={uploading[key]}
            onUpload={async (file) => {
              setUploading(u=>({...u,[key]:true}));
              try { const res=await uploadSettingFile(key, file); const newUrls={...tgsUrls,[key]:res.url}; setTgsUrls(newUrls); await updateAppSettings(newUrls); hapticNotification("success"); }
              catch(e){alert("Upload failed: "+e.message);}
              finally{setUploading(u=>({...u,[key]:false}));}
            }}
            onClear={async () => { const newUrls={...tgsUrls,[key]:""}; setTgsUrls(newUrls); await updateAppSettings(newUrls); }}
          />
        ))}
      </div>

      <div className="section-title">Telegram Channel</div>
      <div className="card">
        <div style={{ fontSize:12,color:"var(--hint)",marginBottom:12 }}>Adds a channel button in the app header. Leave empty to hide it.</div>
        <div className="field"><div className="label">Channel Link</div><input className="input" value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} placeholder="https://t.me/your_channel"/></div>
      </div>

      <div className="section-title">Require Channel Join</div>
      <div className="card">
        <div style={{ fontSize:12,color:"var(--hint)",marginBottom:12 }}>Force users to join a channel before using the app. Your bot must be an <b>admin</b> in that channel.</div>
        <div className="field" style={{ marginBottom:10 }}><div className="label">Channel Link (shown to users)</div><input className="input" value={requiredChannel} onChange={(e) => setRequiredChannel(e.target.value)} placeholder="https://t.me/your_channel"/></div>
        <div className="field"><div className="label">Channel ID or @username (for bot check)</div><input className="input" style={{ fontFamily:"monospace" }} value={requiredChannelId} onChange={(e) => setRequiredChannelId(e.target.value)} placeholder="@YourChannel or -100123456789"/></div>
      </div>

      <div className="section-title">Button Emoji</div>
      <div className="card">
        <div style={{ fontSize:12,color:"var(--hint)",marginBottom:12 }}>This emoji shows on main action buttons. Get IDs from @getidsbot on Telegram.</div>
        <div className="field"><div className="label">Emoji ID</div><input className="input" value={emojiId} onChange={(e) => setEmojiId(e.target.value)} placeholder={DEFAULT_EMOJI_ID} style={{ fontFamily:"monospace" }}/></div>
      </div>

      <div style={{ display:"flex",gap:8 }}>
        <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setEmojiId(DEFAULT_EMOJI_ID)}><RefreshCw size={15}/> Reset Emoji</button>
        <button className="btn btn-primary" style={{ flex:2 }} onClick={save}><Save size={15}/>{saved?"Saved ✓":"Save Settings"}</button>
      </div>

      <div className="section-title">Home Screen</div>
      <div className="card">
        <div style={{ fontSize:13,color:"var(--hint)",marginBottom:12 }}>Add MagicMall shortcut to phone home screen</div>
        <button className="btn btn-secondary btn-full" onClick={addToHomeScreen}><Home size={16}/> Add to Home Screen</button>
      </div>
    </div>
  );
}

function TgsUploadRow({ label, defaultEmoji, url, uploading, onUpload, onClear }) {
  const ref = useRef();
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
      <div style={{ width:36,height:36,flexShrink:0,borderRadius:8,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,overflow:"hidden" }}>
        {url ? <AnimationPreview url={url} fileType={url.endsWith("tgs")?"tgs":"json"} size="36px" autoplay loop/> : defaultEmoji}
      </div>
      <div style={{ flex:1,fontSize:13,fontWeight:600 }}>{label}</div>
      <input ref={ref} type="file" accept=".tgs,.json" style={{ display:"none" }} onChange={(e) => e.target.files?.[0]&&onUpload(e.target.files[0])}/>
      {url ? (
        <button className="btn btn-secondary" style={{ padding:"4px 8px",fontSize:12 }} onClick={onClear}><X size={12}/> Clear</button>
      ) : (
        <button className="btn btn-secondary" style={{ padding:"4px 8px",fontSize:12 }} disabled={uploading} onClick={() => ref.current?.click()}>
          <Upload size={12}/> {uploading?"…":"Upload"}
        </button>
      )}
    </div>
  );
}
