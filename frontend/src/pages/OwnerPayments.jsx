import { useState, useEffect, useRef } from "react";
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, uploadPaymentLogo } from "../lib/api";
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from "lucide-react";

const EMPTY = { name:"", logo_url:"", account_name:"", account_number:"", is_visible:true, sort_order:0 };

export default function OwnerPayments() {
  const [methods,   setMethods]   = useState([]);
  const [editing,   setEditing]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setMethods(await getPaymentMethods()); }
    finally { setLoading(false); }
  }

  async function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadPaymentLogo(file);
      setEditing((p) => ({ ...p, logo_url: res.url }));
    } finally { setUploading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      if (editing.id) await updatePaymentMethod(editing.id, editing);
      else await createPaymentMethod(editing);
      setEditing(null);
      await load();
    } catch (e) {
      alert("Failed: " + (e.response?.data?.detail || e.message));
    } finally { setSaving(false); }
  }

  async function del(m) {
    if (!confirm(`Delete "${m.name}"?`)) return;
    await deletePaymentMethod(m.id);
    await load();
  }

  if (editing !== null) {
    return (
      <div className="page-body">
        <div className="row-between">
          <div style={{ fontWeight:700, fontSize:16 }}>
            {editing.id ? "Edit Payment" : "New Payment Method"}
          </div>
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => setEditing(null)}>
            <X size={18} />
          </button>
        </div>

        <div className="field">
          <div className="label">Name *</div>
          <input className="input" value={editing.name}
            onChange={(e) => setEditing({...editing, name:e.target.value})}
            placeholder="e.g. KBZ Pay" />
        </div>

        <div className="card">
          <div className="label" style={{ marginBottom:8 }}>Logo (PNG / SVG)</div>
          <input ref={fileRef} type="file" accept=".png,.jpg,.svg"
            style={{ display:"none" }} onChange={handleLogo} />
          {editing.logo_url ? (
            <div className="row" style={{ gap:10 }}>
              <img src={editing.logo_url} alt="logo"
                style={{ width:44,height:44,objectFit:"contain",borderRadius:8 }} />
              <button className="btn btn-ghost" style={{ fontSize:12,padding:"4px 0" }}
                onClick={() => fileRef.current?.click()}>
                Change logo
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-full" disabled={uploading}
              onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "+ Upload Logo"}
            </button>
          )}
        </div>

        <div className="field">
          <div className="label">Account Name</div>
          <input className="input" value={editing.account_name||""}
            onChange={(e) => setEditing({...editing, account_name:e.target.value})}
            placeholder="Account holder name" />
        </div>

        <div className="field">
          <div className="label">Account Number</div>
          <input className="input" value={editing.account_number||""}
            onChange={(e) => setEditing({...editing, account_number:e.target.value})}
            placeholder="09xxxxxxxxx" />
        </div>

        <div className="field">
          <div className="label">Sort Order</div>
          <input className="input" type="number" value={editing.sort_order}
            onChange={(e) => setEditing({...editing, sort_order:parseInt(e.target.value)||0})} />
        </div>

        <div className="card">
          <div className="row-between">
            <span style={{ fontWeight:600 }}>Visible to customers</span>
            <label className="toggle">
              <input type="checkbox" checked={editing.is_visible}
                onChange={(e) => setEditing({...editing, is_visible:e.target.checked})} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        </div>

        <button className="btn btn-primary btn-full" disabled={saving || !editing.name.trim()}
          onClick={save} style={{ padding:"14px" }}>
          {saving ? "Saving…" : editing.id ? "Save Changes" : "Create"}
        </button>
      </div>
    );
  }

  return (
    <div className="page-body">
      <button className="btn btn-primary btn-full" onClick={() => setEditing({...EMPTY})}>
        <Plus size={18} /> Add Payment Method
      </button>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
          <div className="spinner" />
        </div>
      ) : methods.length === 0 ? (
        <div className="empty-state">No payment methods yet</div>
      ) : (
        methods.map((m) => (
          <div key={m.id} className="card">
            <div className="row-between">
              <div className="row" style={{ gap:10 }}>
                {m.logo_url && (
                  <img src={m.logo_url} alt={m.name}
                    style={{ width:40,height:40,objectFit:"contain",borderRadius:8 }} />
                )}
                <div>
                  <div style={{ fontWeight:600 }}>{m.name}</div>
                  {m.account_name && <div style={{ fontSize:12,color:"var(--hint)" }}>{m.account_name}</div>}
                  {m.account_number && <div style={{ fontSize:13,fontFamily:"monospace" }}>{m.account_number}</div>}
                </div>
              </div>
              <div className="row" style={{ gap:4 }}>
                <span style={{ fontSize:11,color:m.is_visible?"var(--success)":"var(--hint)" }}>
                  {m.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </span>
                <button className="btn btn-ghost" style={{ padding:6 }}
                  onClick={() => setEditing({...m})}>
                  <Edit2 size={16} />
                </button>
                <button className="btn btn-ghost" style={{ padding:6,color:"var(--danger)" }}
                  onClick={() => del(m)}>
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
