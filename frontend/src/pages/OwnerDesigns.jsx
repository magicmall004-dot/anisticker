import { useState, useEffect, useRef } from "react";
import { getDesigns, getCategories, createDesign, updateDesign, deleteDesign, uploadDesignFile } from "../lib/api";
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from "lucide-react";
import AnimationPreview from "../components/AnimationPreview";
import ColorPicker from "../components/ColorPicker";
import { formatPrice } from "../lib/utils";
import { hapticNotification } from "../lib/telegram";

const EMPTY = {
  name:"", category_id:"", type:"regular",
  file_url:"", file_type:"json",
  primary_color:"#000000", secondary_color:"#ffffff",
  has_text:false, user_price:0, reseller_price:0, is_visible:true,
};

export default function OwnerDesigns() {
  const [designs,    setDesigns]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing,    setEditing]    = useState(null);   // null | EMPTY | existing
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        getDesigns({ show_hidden: true }),
        getCategories(),
      ]);
      setDesigns(d);
      setCategories(c);
    } finally { setLoading(false); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDesignFile(file);
      setEditing((prev) => ({ ...prev, file_url: res.url, file_type: res.file_type }));
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally { setUploading(false); }
  }

  async function save() {
    if (!editing.name.trim()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await updateDesign(editing.id, editing);
      } else {
        await createDesign(editing);
      }
      hapticNotification("success");
      setEditing(null);
      await loadAll();
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    } finally { setSaving(false); }
  }

  async function toggleVisible(design) {
    await updateDesign(design.id, { is_visible: !design.is_visible });
    await loadAll();
  }

  async function handleDelete(design) {
    if (!confirm(`Delete "${design.name}"?`)) return;
    await deleteDesign(design.id);
    await loadAll();
  }

  if (editing !== null) {
    return (
      <div className="page-body">
        <div className="row-between">
          <div style={{ fontWeight:700, fontSize:16 }}>
            {editing.id ? "Edit Design" : "New Design"}
          </div>
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => setEditing(null)}>
            <X size={18} />
          </button>
        </div>

        <div className="field">
          <div className="label">Name *</div>
          <input className="input" value={editing.name}
            onChange={(e) => setEditing({...editing, name:e.target.value})}
            placeholder="Design name" />
        </div>

        <div className="field">
          <div className="label">Category</div>
          <select className="input" value={editing.category_id || ""}
            onChange={(e) => setEditing({...editing, category_id:e.target.value||null})}
            style={{ color:"var(--text)", background:"rgba(255,255,255,.07)" }}>
            <option value="">— No category —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="label">Type</div>
          <div className="row" style={{ gap:10 }}>
            {["regular","adaptive"].map((t) => (
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
                <div style={{ fontSize:12, color:"var(--success)" }}>✓ File uploaded</div>
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
        </div>

        {/* Colors */}
        <div className="card">
          <ColorPicker label="Primary Color"
            value={editing.primary_color||"#000000"}
            onChange={(v) => setEditing({...editing, primary_color:v})} />
          <div style={{ marginTop:14 }}>
            <ColorPicker label="Secondary Color"
              value={editing.secondary_color||"#ffffff"}
              onChange={(v) => setEditing({...editing, secondary_color:v})} />
          </div>
        </div>

        {/* has_text toggle */}
        <div className="card">
          <div className="row-between">
            <div>
              <div style={{ fontWeight:600 }}>Requires Text</div>
              <div style={{ fontSize:12, color:"var(--hint)" }}>Customer must provide text</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={editing.has_text}
                onChange={(e) => setEditing({...editing, has_text:e.target.checked})} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
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

        <button className="btn btn-primary btn-full" disabled={saving || !editing.name.trim()}
          onClick={save} style={{ padding:"14px" }}>
          {saving ? "Saving…" : editing.id ? "Save Changes" : "Create Design"}
        </button>
      </div>
    );
  }

  return (
    <div className="page-body">
      <button className="btn btn-primary btn-full" onClick={() => setEditing({...EMPTY})}>
        <Plus size={18} /> New Design
      </button>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
          <div className="spinner" />
        </div>
      ) : designs.length === 0 ? (
        <div className="empty-state">No designs yet</div>
      ) : (
        designs.map((d) => (
          <div key={d.id} className="card">
            <div className="row-between">
              <div className="row" style={{ gap:10 }}>
                {d.file_url ? (
                  <AnimationPreview url={d.file_url} fileType={d.file_type} size="44px" autoplay loop />
                ) : (
                  <div style={{ width:44,height:44,borderRadius:8,background:"rgba(0,0,0,.2)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🎞</div>
                )}
                <div>
                  <div style={{ fontWeight:600 }}>{d.name}</div>
                  <div style={{ fontSize:12, color:"var(--hint)" }}>
                    {d.category_name || "—"} · {d.type}
                  </div>
                  <div style={{ fontSize:12, color:"var(--accent2)", fontWeight:600 }}>
                    {formatPrice(d.user_price)}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap:4 }}>
                <button className="btn btn-ghost" style={{ padding:6 }}
                  onClick={() => toggleVisible(d)}>
                  {d.is_visible ? <Eye size={16} /> : <EyeOff size={16} color="var(--hint)" />}
                </button>
                <button className="btn btn-ghost" style={{ padding:6 }}
                  onClick={() => setEditing({...d})}>
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
