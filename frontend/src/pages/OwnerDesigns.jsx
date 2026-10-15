import { useState, useEffect, useRef } from "react";
import { getDesigns, getDesign, getCategories, createDesign, updateDesign, deleteDesign, uploadDesignFile, syncEmojiNow, confirmManualEmoji, verifyEmojiLinks, requestFileViaBot, cleanupOrphanedEmoji } from "../lib/api";
import LayerPicker from "../components/LayerPicker";
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Check, Film, Sparkles } from "lucide-react";
import AnimationPreview from "../components/AnimationPreview";
import ColorPicker from "../components/ColorPicker";
import { formatPrice } from "../lib/utils";
import { hapticNotification } from "../lib/telegram";

const EMPTY = {
  category_id:"", type:"regular", tags:[], text_slots:[],
  is_instant:false, logo_slots:[], color_map:[],
  file_url:"", file_type:"json",
  primary_color:"#000000", secondary_color:"#ffffff", extra_colors:[],
  has_text:false, user_price:0, reseller_price:0, is_visible:true,
};

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}
      style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:6,padding:"3px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:copied?"var(--success)":"var(--hint)",fontSize:11,fontWeight:600 }}>
      {copied ? "✓ Copied" : `⎘ ${label||"Copy"}`}
    </button>
  );
}

function TagInput({ tags, onChange, suggestions = [] }) {
  const [input, setInput] = useState("");
  const [showSug, setShowSug] = useState(false);
  const filteredSug = input
    ? suggestions.filter(s => s.includes(input) && !tags.includes(s)).slice(0, 8)
    : suggestions.filter(s => !tags.includes(s)).slice(0, 8);

  function addTag(val) {
    const tag = val.trim().toUpperCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0,-1));
    }
  }

  const upperTags = tags.map(t => t.toUpperCase());
  return (
    <div style={{ display:"flex",flexWrap:"wrap",gap:6,padding:"8px 10px",borderRadius:"var(--radius-sm)",background:"var(--card)",border:"1px solid var(--border)",minHeight:42,alignItems:"center" }}>
      {upperTags.map((tag,i) => (
        <div key={i} style={{ display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,background:"rgba(var(--accent-rgb),0.12)",border:"1px solid rgba(var(--accent-rgb),0.25)",fontSize:12,fontWeight:600,color:"var(--accent)" }}>
          #{tag}
          <span onClick={() => onChange(tags.filter((_,j)=>j!==i))} style={{ cursor:"pointer",fontSize:13,lineHeight:1,color:"var(--accent)",marginLeft:2 }}>×</span>
        </div>
      ))}
      <div style={{ position:"relative", flex:1, minWidth:80 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,""))}
          onKeyDown={handleKey}
          onFocus={() => setShowSug(true)}
          onBlur={() => { setTimeout(()=>setShowSug(false), 150); if (input) addTag(input); }}
          placeholder={tags.length ? "add tag…" : "logo, colour, cute…"}
          style={{ border:"none",outline:"none",background:"transparent",color:"var(--text)",fontSize:13,fontFamily:"var(--font)",width:"100%" }}
        />
        {showSug && filteredSug.length > 0 && (
          <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, boxShadow:"var(--shadow)", zIndex:20, maxHeight:160, overflowY:"auto" }}>
            {filteredSug.map(s => (
              <div key={s} onMouseDown={() => addTag(s)}
                style={{ padding:"7px 10px", fontSize:12, fontWeight:600, cursor:"pointer", color:"var(--text)" }}>
                #{s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmojiSyncButton({ design, onSynced }) {
  const [syncing, setSyncing] = useState(false);
  const status = syncing ? "yellow" : design.custom_emoji_id ? "green" : "red";
  const colorMap = { green: "#22c55e", red: "#ef4444", yellow: "#f59e0b" };
  const titleMap = {
    green: "Added to emoji pack — click to re-sync",
    red: "Not in emoji pack — click to add",
    yellow: "Syncing…",
  };

  async function handleClick() {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncEmojiNow(design.id);
    } catch (e) {
      alert(
        "Automatic sync failed: " + (e.response?.data?.detail || e.message) +
        "\n\nIf this keeps happening, add it to the emoji pack manually via " +
        "Telegram, then use the checkmark button to confirm it here."
      );
    } finally {
      setSyncing(false);
      onSynced(); // always refresh so the dot reflects the true current status, success or failure
    }
  }

  return (
    <button className="btn btn-ghost" style={{ padding:6, position:"relative" }}
      title={titleMap[status]} disabled={syncing} onClick={handleClick}>
      <Sparkles size={16} />
      <span style={{
        position:"absolute", top:2, right:2, width:8, height:8, borderRadius:"50%",
        background: colorMap[status], border:"1.5px solid var(--card)",
      }} />
    </button>
  );
}

function ManualConfirmButton({ design, onSynced }) {
  const [checking, setChecking] = useState(false);

  async function handleClick() {
    if (checking) return;
    setChecking(true);
    try {
      await confirmManualEmoji(design.id);
      onSynced();
    } catch (e) {
      alert("Couldn't confirm: " + (e.response?.data?.detail || e.message));
    } finally {
      setChecking(false);
    }
  }

  return (
    <button className="btn btn-ghost" style={{ padding:6 }}
      title="Added it manually via Telegram? Click to confirm and link it here."
      disabled={checking} onClick={handleClick}>
      <Check size={16} color={checking ? "var(--hint)" : "var(--accent)"} />
    </button>
  );
}

export default function OwnerDesigns() {
  const [playIds, setPlayIds] = useState(new Set());
  const [verifying, setVerifying] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const savedScrollRef = useRef(0);
  const [designs,    setDesigns]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing,    setEditing]    = useState(null);   // null | EMPTY | existing
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [requestingBot,   setRequestingBot]   = useState(false);
  const [botRequestSent,  setBotRequestSent]  = useState(false);
  const [detectedColors,  setDetectedColors]  = useState([]);
  const fileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  async function loadAll(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [d, c] = await Promise.all([
        getDesigns({ show_hidden: true }),
        getCategories(),
      ]);
      setDesigns(d);
      setCategories(c);
    } finally { if (!silent) setLoading(false); }
  }

  async function handleRequestViaBot() {
    setRequestingBot(true);
    try {
      let targetId = editing.id;
      if (!targetId) {
        // No design saved yet — save it now (with whatever fields are
        // already filled in) so there's a stable id to attach the pending
        // file request to. You can keep editing the rest afterward.
        const created = await createDesign(editing);
        targetId = created.id;
        setEditing((prev) => ({ ...prev, ...created }));
      }
      await requestFileViaBot(targetId);
      setBotRequestSent(true);
      hapticNotification("success");
    } catch (e) {
      alert("Couldn't request: " + (e.response?.data?.detail || e.message));
    } finally {
      setRequestingBot(false);
    }
  }

  async function handleRefreshFromBot() {
    if (!editing.id) return;
    try {
      const fresh = await getDesign(editing.id);
      // Pick up everything the bot may have changed server-side (the file,
      // AND the emoji-pack link if it already synced) — without this, the
      // next Save would send stale nulls for the emoji fields and cause a
      // duplicate sticker to get added.
      setEditing((prev) => ({
        ...prev,
        file_url: fresh.file_url,
        file_type: fresh.file_type,
        custom_emoji_id: fresh.custom_emoji_id,
        emoji_sticker_file_id: fresh.emoji_sticker_file_id,
        emoji_pack_id: fresh.emoji_pack_id,
      }));
      setBotRequestSent(false);
      hapticNotification("success");
    } catch (e) {
      alert("Couldn't refresh: " + (e.response?.data?.detail || e.message));
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDesignFile(file, editing.id || null, editing.file_url || null);
      setEditing((prev) => ({ ...prev, file_url: res.url, file_type: res.file_type }));
      if (res.file_type === "tgs") {
        import("../lib/api").then(m => {
          m.default.post("/instant/parse-tgs-url", { url: res.url })
            .then(r => setDetectedColors((r.data.colors||[]).filter(c=>c!="#000000"&&c!="#ffffff")))
            .catch(()=>{});
        });
      }
      if (res.file_type === "tgs") {
        import("../lib/api").then(m => {
          m.default.post("/instant/parse-tgs-url", { url: res.url })
            .then(r => setDetectedColors((r.data.colors||[]).filter(c=>c!="#000000"&&c!="#ffffff")))
            .catch(()=>{});
        });
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally { setUploading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      if (editing.id) {
        await updateDesign(editing.id, editing);
      } else {
        await createDesign(editing);
      }
      hapticNotification("success");
      setEditing(null);
      await loadAll(true);
      requestAnimationFrame(() => window.scrollTo(0, savedScrollRef.current));
    } catch (e) {
      const det = e.response?.data?.detail;
      const msg = Array.isArray(det) ? det.map(d=>d.msg||JSON.stringify(d)).join(", ") : (typeof det==="object"&&det ? JSON.stringify(det) : det || e.message);
      alert("Failed: " + msg);
    } finally { setSaving(false); }
  }

  async function toggleVisible(design) {
    await updateDesign(design.id, { is_visible: !design.is_visible });
    await loadAll(true);
  }

  async function handleCleanupOrphanedEmoji() {
    if (cleaning) return;
    if (!confirm("Remove every emoji-pack sticker that isn't linked to a design? This can't be undone.")) return;
    setCleaning(true);
    try {
      const res = await cleanupOrphanedEmoji();
      const n = res.removed_count || 0;
      alert(n > 0 ? `Removed ${n} orphaned sticker${n===1?"":"s"}.` : "No orphaned stickers found.");
    } catch (e) {
      alert("Couldn't clean up: " + (e.response?.data?.detail || e.message));
    } finally {
      setCleaning(false);
    }
  }

  async function handleVerifyEmojiLinks() {
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await verifyEmojiLinks();
      const n = (res.cleared || []).length;
      alert(n > 0
        ? `Checked against Telegram — ${n} design${n===1?"":"s"} had been removed there and ${n===1?"is":"are"} now shown as not-added.`
        : "Checked against Telegram — everything matches, no changes needed.");
      await loadAll(true);
    } catch (e) {
      alert("Couldn't verify: " + (e.response?.data?.detail || e.message));
    } finally {
      setVerifying(false);
    }
  }

  async function handleDelete(design) {
    if (!confirm("Delete this design?")) return;
    await deleteDesign(design.id);
    await loadAll(true);
  }

  if (editing !== null) {
    return (
      <div className="page-body">
        <div className="row-between">
          <div style={{ fontWeight:700, fontSize:16 }}>
            {editing.id ? "Edit Design" : "New Design"}
          </div>
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => { setEditing(null); requestAnimationFrame(() => window.scrollTo(0, savedScrollRef.current)); }}>
            <X size={18} />
          </button>
        </div>

        <div className="field">
          <div className="label">Tags (comma separated)</div>
          <TagInput
            suggestions={[...new Set(designs.flatMap(d => d.tags||[]))].sort()}
            tags={editing.tags||[]}
            onChange={tags => setEditing({...editing, tags})}/>
        </div>

        <div className="field">
          <div className="label">Category</div>
          <select className="input" value={editing.category_id || ""}
            onChange={(e) => {
              const catId = e.target.value || null;
              const cat = categories.find(c => c.id === catId);
              setEditing({
                ...editing,
                category_id: catId,
                user_price: cat ? (cat.default_user_price ?? editing.user_price) : editing.user_price,
                reseller_price: cat ? (cat.default_reseller_price ?? editing.reseller_price) : editing.reseller_price,
              });
            }}
            style={{ color:"var(--text)", background:"rgba(255,255,255,.07)" }}>
            <option value="">— No category —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="label">Type</div>
          <div className="row" style={{ gap:10 }}>
            {["regular","adaptive","fixed","premium"].map((t) => (
              <button key={t}
                className={`btn ${editing.type===t ? "btn-primary" : "btn-secondary"}`}
                style={{ flex:1, textTransform:"capitalize" }}
                onClick={() => setEditing({...editing, type:t})}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div className="card">
          <div className="label" style={{ marginBottom:8 }}>Animation File (JSON / TGS)</div>
          <input ref={fileRef} type="file" accept=".json,.tgs"
            style={{ display:"none" }} onChange={handleFileUpload} />
          {editing.file_url ? (
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <AnimationPreview url={editing.file_url} fileType={editing.file_type}
                size="64px" autoplay loop />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:"var(--success)" }}><Check size={12} style={{display:"inline",verticalAlign:"-1px"}}/> File uploaded</div>
                <button className="btn btn-ghost" style={{ padding:"4px 0", fontSize:12 }}
                  onClick={() => fileRef.current?.click()}>
                  Change file
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-secondary btn-full" disabled={uploading}
              onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "+ Upload Animation"}
            </button>
          )}

          <div style={{ marginTop:10 }}>
            {!botRequestSent ? (
              <button className="btn btn-secondary btn-full" style={{ fontSize:12 }} disabled={requestingBot} onClick={handleRequestViaBot}>
                {requestingBot ? "Requesting…" : "📤 Send via Bot instead"}
              </button>
            ) : (
              <div style={{ background:"rgba(var(--accent-rgb),0.08)", border:"1px solid rgba(var(--accent-rgb),0.2)", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:12, color:"var(--text)", marginBottom:8 }}>
                  Now forward the file directly to your bot in Telegram (don't save it to your device first — send it straight from wherever you got it).
                </div>
                <button className="btn btn-primary btn-full" style={{ fontSize:12, padding:8 }} onClick={handleRefreshFromBot}>
                  I sent it — refresh
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Colors - hidden when instant mode (colors managed by LayerPicker) or type is fixed */}
        {!editing.is_instant && editing.type !== "fixed" && (
        <div className="card">
          <ColorPicker label={editing.type === "adaptive" ? "Adaptive Color" : "Primary Color"}
            value={editing.primary_color||"#000000"}
            onChange={(v) => setEditing({...editing, primary_color:v})} />
          {editing.type !== "adaptive" && (
          <div style={{ marginTop:14 }}>
            <ColorPicker label="Secondary Color"
              value={editing.secondary_color||"#ffffff"}
              onChange={(v) => setEditing({...editing, secondary_color:v})} />
          </div>
          )}
          {(editing.type === "regular" || editing.type === "premium") && (
          <div style={{ marginTop:14 }}>
            <div className="label" style={{ marginBottom:8 }}>Extra Colors</div>
            {(editing.extra_colors||[]).map((hex, idx) => (
              <div key={idx} className="row" style={{ gap:8, marginBottom:8 }}>
                <input type="color" value={hex}
                  onChange={(e) => {
                    const arr=[...(editing.extra_colors||[])]; arr[idx]=e.target.value;
                    setEditing({...editing, extra_colors:arr});
                  }}
                  style={{ width:42,height:38,borderRadius:8,border:"2px solid var(--border)",cursor:"pointer",padding:2,background:"transparent",flexShrink:0 }}/>
                <input className="input" value={hex} style={{ fontFamily:"monospace",fontSize:13,flex:1 }}
                  onChange={(e) => {
                    const arr=[...(editing.extra_colors||[])]; arr[idx]=e.target.value;
                    setEditing({...editing, extra_colors:arr});
                  }}/>
                <button className="btn btn-secondary" style={{ padding:"8px 10px", flexShrink:0 }}
                  onClick={() => setEditing({...editing, extra_colors:(editing.extra_colors||[]).filter((_,i)=>i!==idx)})}><X size={13}/></button>
              </div>
            ))}
            <button className="btn btn-secondary btn-full" style={{ fontSize:13 }}
              onClick={() => setEditing({...editing, extra_colors:[...(editing.extra_colors||[]), "#ff0000"]})}>
              + Add Extra Color
            </button>
          </div>
          )}
        </div>
        )}

        {/* Text slots */}
        <div className="card">
          <div className="row-between">
            <div>
              <div style={{ fontWeight:600 }}>Requires Text</div>
              <div style={{ fontSize:12, color:"var(--hint)" }}>Customer must provide text</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={editing.has_text}
                onChange={(e) => {
                  const on = e.target.checked;
                  setEditing({
                    ...editing,
                    has_text: on,
                    text_slots: on && !(editing.text_slots||[]).length
                      ? [{name:"",placeholder:""}]
                      : editing.text_slots||[]
                  });
                }} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        </div>

        {/* Text slot inputs when has_text is on */}
        {editing.has_text && (
          <div className="card">
            <div style={{ fontWeight:600, marginBottom:6 }}>Text Slots</div>
            <div style={{ fontSize:12, color:"var(--hint)", marginBottom:10 }}>
              Add named slots (e.g. Open, Close). Customer fills these when ordering.
            </div>
            {(editing.text_slots||[]).map((slot, idx) => (
              <div key={idx} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
                <input className="input" style={{ flex:1 }}
                  placeholder="Name (e.g. Open)"
                  value={slot.name}
                  onChange={(e) => {
                    const slots=[...(editing.text_slots||[])];
                    slots[idx]={...slots[idx], name:e.target.value};
                    setEditing({...editing, text_slots:slots});
                  }} />
                <input className="input" style={{ flex:1 }}
                  placeholder="Hint (optional)"
                  value={slot.placeholder||""}
                  onChange={(e) => {
                    const slots=[...(editing.text_slots||[])];
                    slots[idx]={...slots[idx], placeholder:e.target.value};
                    setEditing({...editing, text_slots:slots});
                  }} />
                <button className="btn btn-secondary" style={{ padding:"8px 10px", flexShrink:0 }}
                  onClick={() => {
                    const slots=(editing.text_slots||[]).filter((_,i)=>i!==idx);
                    setEditing({...editing, text_slots:slots, has_text:slots.length>0});
                  }}><X size={13}/></button>
              </div>
            ))}
            <button className="btn btn-secondary" style={{ fontSize:13, width:"100%" }}
              onClick={() => setEditing({...editing, text_slots:[...(editing.text_slots||[]),{name:"",placeholder:""}]})}>
              + Add Text Slot
            </button>
          </div>
        )}

        {/* Instant design */}
        <div className="card">
          <div className="row-between" style={{ marginBottom: editing.is_instant ? 12 : 0 }}>
            <div>
              <div style={{ fontWeight:600 }}>Instant Design</div>
              <div style={{ fontSize:12, color:"var(--hint)" }}>Auto-process: replace logo & colors, deliver instantly</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={editing.is_instant||false}
                onChange={e => setEditing({...editing, is_instant:e.target.checked})}/>
              <div className="toggle-track"/><div className="toggle-thumb"/>
            </label>
          </div>
          {editing.is_instant && editing.type !== "fixed" && (
            <LayerPicker
              fileUrl={editing.file_url}
              colorMap={editing.color_map||[]}
              onColorMapChange={cm => setEditing({...editing, color_map:cm})}
              detectedColors={detectedColors}
              maxColors={editing.type === "adaptive" ? 1 : undefined}
            />
          )}
          {editing.is_instant && editing.type === "fixed" && (
            <div style={{ fontSize:12, color:"var(--hint)" }}>Fixed type — no color customization needed.</div>
          )}
        </div>

        {/* Pricing */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:12 }}>Pricing</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div className="field">
              <div className="label">User Price</div>
              <input className="input" type="number" min="0"
                value={editing.user_price}
                onChange={(e) => setEditing({...editing, user_price:parseFloat(e.target.value)||0})} />
            </div>
            <div className="field">
              <div className="label">Reseller Price</div>
              <input className="input" type="number" min="0"
                value={editing.reseller_price}
                onChange={(e) => setEditing({...editing, reseller_price:parseFloat(e.target.value)||0})} />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="card">
          <div className="row-between">
            <div style={{ fontWeight:600 }}>Visible to customers</div>
            <label className="toggle">
              <input type="checkbox" checked={editing.is_visible}
                onChange={(e) => setEditing({...editing, is_visible:e.target.checked})} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        </div>

        <button className="btn btn-primary btn-full" disabled={saving}
          onClick={save} style={{ padding:"14px" }}>
          {saving ? "Saving…" : editing.id ? "Save Changes" : "Create Design"}
        </button>
      </div>
    );
  }

  const [dq, setDq] = useState("");
  const [fCat, setFCat] = useState("all");
  const [fType, setFType] = useState("all");
  const [fPack, setFPack] = useState("all");
  const _n = dq.trim().toLowerCase().replace(/^#/, "");
  const typeList = Array.from(new Set(designs.map((d) => d.type).filter(Boolean)));
  const filteredDesigns = designs.filter((d) => {
    if (_n && !(String(d.custom_id || "").toLowerCase().includes(_n) || String(d.id).toLowerCase().includes(_n) || (d.name || "").toLowerCase().includes(_n))) return false;
    if (fCat === "none" ? d.category_id : (fCat !== "all" && d.category_id !== fCat)) return false;
    if (fType !== "all" && d.type !== fType) return false;
    if (fPack === "in" && !d.custom_emoji_id) return false;
    if (fPack === "out" && d.custom_emoji_id) return false;
    return true;
  });
  const hasFilter = _n || fCat !== "all" || fType !== "all" || fPack !== "all";
  const chip = (on) => ({ padding:"6px 12px", borderRadius:99, fontSize:11, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, background:on?"rgba(var(--accent-rgb),0.15)":"rgba(255,255,255,0.06)", color:on?"var(--accent)":"var(--hint)" });

  return (
    <div className="page-body">
      <button className="btn btn-primary btn-full" onClick={() => { savedScrollRef.current = window.scrollY; setEditing({...EMPTY}); }}>
        <Plus size={18} /> New Design
      </button>

      <button className="btn btn-secondary btn-full" disabled={verifying} onClick={handleVerifyEmojiLinks} style={{ marginTop:8 }}>
        {verifying ? "Checking against Telegram…" : "Verify Emoji Status vs Telegram"}
      </button>

      <button className="btn btn-secondary btn-full" disabled={cleaning} onClick={handleCleanupOrphanedEmoji} style={{ marginTop:8 }}>
        {cleaning ? "Cleaning up…" : "🧹 Remove Orphaned Emoji Stickers"}
      </button>

      <input className="input" value={dq} onChange={(e) => setDq(e.target.value)} placeholder="Search ID, #custom ID or name…" style={{ marginTop:10 }} />
      <div className="scroll-row" style={{ marginTop:8 }}>
        <button style={chip(fCat==="all")} onClick={() => setFCat("all")}>All categories</button>
        {categories.map((c) => <button key={c.id} style={chip(fCat===c.id)} onClick={() => setFCat(fCat===c.id?"all":c.id)}>{c.name}</button>)}
        <button style={chip(fCat==="none")} onClick={() => setFCat(fCat==="none"?"all":"none")}>No category</button>
      </div>
      <div className="scroll-row" style={{ marginTop:6 }}>
        <button style={chip(fType==="all")} onClick={() => setFType("all")}>All types</button>
        {typeList.map((t) => <button key={t} style={chip(fType===t)} onClick={() => setFType(fType===t?"all":t)}>{t}</button>)}
      </div>
      <div className="scroll-row" style={{ marginTop:6 }}>
        <button style={chip(fPack==="all")} onClick={() => setFPack("all")}>Any pack status</button>
        <button style={chip(fPack==="in")} onClick={() => setFPack(fPack==="in"?"all":"in")}>🟢 In emoji pack</button>
        <button style={chip(fPack==="out")} onClick={() => setFPack(fPack==="out"?"all":"out")}>🔴 Not in pack</button>
      </div>
      <div className="row-between" style={{ fontSize:11, color:"var(--hint)", margin:"8px 2px 2px" }}>
        <span>{filteredDesigns.length} of {designs.length} designs</span>
        {hasFilter && <button className="btn btn-ghost" style={{ padding:"2px 8px", fontSize:11 }} onClick={() => { setDq(""); setFCat("all"); setFType("all"); setFPack("all"); }}>Clear filters</button>}
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
          <div className="spinner" />
        </div>
      ) : designs.length === 0 ? (
        <div className="empty-state">No designs yet</div>
      ) : filteredDesigns.length === 0 ? (
        <div className="empty-state">No designs match these filters</div>
      ) : (
        filteredDesigns.map((d) => (
          <div key={d.id} className="card">
            <div className="row-between">
              <div className="row" style={{ gap:10 }}>
                {d.file_url ? (
                  <div onClick={(e) => { e.stopPropagation(); setPlayIds(prev => { const next = new Set(prev); next.has(d.id) ? next.delete(d.id) : next.add(d.id); return next; }); }} style={{ cursor:"pointer", flexShrink:0 }}>
                    <AnimationPreview url={d.file_url} fileType={d.file_type} size="44px" autoplay={false} loop={false} play={playIds.has(d.id)} />
                  </div>
                ) : (
                  <div style={{ width:44,height:44,borderRadius:8,background:"rgba(0,0,0,.2)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}><Film size={16}/></div>
                )}
                <div>
                  <div className="row" style={{ gap:6, marginBottom:2 }}>
                    {d.custom_id && (
                      <span style={{ fontFamily:"monospace",fontWeight:800,fontSize:13,color:"var(--accent)" }}>#{d.custom_id}</span>
                    )}
                    {d.custom_id && <CopyBtn text={String(d.custom_id)} label="ID"/>}
                    <CopyBtn text={d.id} label="UUID"/>
                  </div>
                  <div style={{ fontSize:11, color:"var(--hint)" }}>
                    {d.category_name || "—"} · {d.type}
                  </div>
                  <div style={{ fontSize:12, color:"var(--accent2)", fontWeight:600 }}>
                    {formatPrice(d.user_price)}
                    <span style={{ color:"var(--hint)", fontWeight:500 }}> · reseller {formatPrice(d.reseller_price)}</span>
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap:4 }}>
                <EmojiSyncButton design={d} onSynced={() => loadAll(true)} />
                {!d.custom_emoji_id && <ManualConfirmButton design={d} onSynced={() => loadAll(true)} />}
                <button className="btn btn-ghost" style={{ padding:6 }}
                  onClick={() => toggleVisible(d)}>
                  {d.is_visible ? <Eye size={16} /> : <EyeOff size={16} color="var(--hint)" />}
                </button>
                <button className="btn btn-ghost" style={{ padding:6 }}
                  onClick={() => { savedScrollRef.current = window.scrollY; setEditing({...d, tags:d.tags||[], text_slots:d.text_slots||[], color_map:d.color_map||[], logo_slots:d.logo_slots||[], is_instant:d.is_instant||false}); }}>
                  <Edit2 size={16} />
                </button>
                <button className="btn btn-ghost" style={{ padding:6, color:"var(--danger)" }}
                  onClick={() => handleDelete(d)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
