import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../lib/api";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function OwnerCategories({ onClose }) {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId,  setEditId]  = useState(null);
  const [editVal, setEditVal] = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setCats(await getCategories()); }
    finally { setLoading(false); }
  }

  async function add() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: newName.trim(), sort_order: cats.length });
      setNewName("");
      await load();
    } finally { setSaving(false); }
  }

  async function saveEdit(id) {
    if (!editVal.trim()) return;
    setSaving(true);
    try {
      await updateCategory(id, { name: editVal.trim(), sort_order: 0 });
      setEditId(null);
      await load();
    } finally { setSaving(false); }
  }

  async function del(cat) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    await deleteCategory(cat.id);
    await load();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div className="row-between">
        <div style={{ fontWeight:700, fontSize:16 }}>Manage Categories</div>
        {onClose && (
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Add new */}
      <div className="row" style={{ gap:8 }}>
        <input className="input" style={{ flex:1 }}
          value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn btn-primary" style={{ padding:"10px 14px" }}
          disabled={saving || !newName.trim()} onClick={add}>
          <Plus size={16} />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:20 }}>
          <div className="spinner" />
        </div>
      ) : cats.length === 0 ? (
        <div className="empty-state" style={{ padding:"20px 0" }}>No categories yet</div>
      ) : (
        cats.map((cat) => (
          <div key={cat.id} className="card" style={{ padding:"10px 12px" }}>
            {editId === cat.id ? (
              <div className="row" style={{ gap:8 }}>
                <input className="input" style={{ flex:1 }}
                  value={editVal} onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)} />
                <button className="btn btn-success" style={{ padding:"8px 10px" }}
                  disabled={saving} onClick={() => saveEdit(cat.id)}>
                  <Check size={15} />
                </button>
                <button className="btn btn-ghost" style={{ padding:"8px 10px" }}
                  onClick={() => setEditId(null)}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="row-between">
                <span style={{ fontWeight:500 }}>{cat.name}</span>
                <div className="row" style={{ gap:4 }}>
                  <button className="btn btn-ghost" style={{ padding:6 }}
                    onClick={() => { setEditId(cat.id); setEditVal(cat.name); }}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding:6, color:"var(--danger)" }}
                    onClick={() => del(cat)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
