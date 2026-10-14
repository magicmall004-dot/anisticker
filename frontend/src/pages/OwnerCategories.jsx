import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { Plus, Edit2, Trash2, Check, X, ChevronUp, ChevronDown } from "lucide-react";

export default function OwnerCategories({ onClose }) {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newUserPrice, setNewUserPrice] = useState(0);
  const [newResellerPrice, setNewResellerPrice] = useState(0);
  const [editId,  setEditId]  = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editUserPrice, setEditUserPrice] = useState(0);
  const [editResellerPrice, setEditResellerPrice] = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [moving,  setMoving]  = useState(false);

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
      await createCategory({
        name: newName.trim(), sort_order: cats.length,
        default_user_price: parseFloat(newUserPrice) || 0,
        default_reseller_price: parseFloat(newResellerPrice) || 0,
      });
      setNewName(""); setNewUserPrice(0); setNewResellerPrice(0);
      await load();
    } finally { setSaving(false); }
  }

  async function saveEdit(id) {
    if (!editVal.trim()) return;
    setSaving(true);
    try {
      const cat = cats.find(c => c.id === id);
      await updateCategory(id, {
        name: editVal.trim(), sort_order: cat?.sort_order ?? 0,
        default_user_price: parseFloat(editUserPrice) || 0,
        default_reseller_price: parseFloat(editResellerPrice) || 0,
      });
      setEditId(null);
      await load();
    } finally { setSaving(false); }
  }

  async function del(cat) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    await deleteCategory(cat.id);
    await load();
  }

  async function move(idx, direction) {
    const otherIdx = idx + direction;
    if (otherIdx < 0 || otherIdx >= cats.length) return;
    setMoving(true);
    try {
      const a = cats[idx];
      const b = cats[otherIdx];
      const aOrder = a.sort_order ?? idx;
      const bOrder = b.sort_order ?? otherIdx;
      await updateCategory(a.id, { name: a.name, sort_order: bOrder, default_user_price: a.default_user_price, default_reseller_price: a.default_reseller_price });
      await updateCategory(b.id, { name: b.name, sort_order: aOrder, default_user_price: b.default_user_price, default_reseller_price: b.default_reseller_price });
      await load();
    } finally { setMoving(false); }
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
      <div className="card" style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <input className="input"
          value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <div className="row" style={{ gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"var(--hint)", marginBottom:4 }}>Default User Price</div>
            <input className="input" type="number" min="0" value={newUserPrice}
              onChange={(e) => setNewUserPrice(e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"var(--hint)", marginBottom:4 }}>Default Reseller Price</div>
            <input className="input" type="number" min="0" value={newResellerPrice}
              onChange={(e) => setNewResellerPrice(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-full"
          disabled={saving || !newName.trim()} onClick={add}>
          <Plus size={16} /> Add Category
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
        cats.map((cat, idx) => (
          <div key={cat.id} className="card" style={{ padding:"10px 12px" }}>
            {editId === cat.id ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input className="input"
                  value={editVal} onChange={(e) => setEditVal(e.target.value)} />
                <div className="row" style={{ gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"var(--hint)", marginBottom:4 }}>User Price</div>
                    <input className="input" type="number" min="0" value={editUserPrice}
                      onChange={(e) => setEditUserPrice(e.target.value)} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"var(--hint)", marginBottom:4 }}>Reseller Price</div>
                    <input className="input" type="number" min="0" value={editResellerPrice}
                      onChange={(e) => setEditResellerPrice(e.target.value)} />
                  </div>
                </div>
                <div className="row" style={{ gap:8 }}>
                  <button className="btn btn-success" style={{ flex:1, padding:"8px 10px" }}
                    disabled={saving} onClick={() => saveEdit(cat.id)}>
                    <Check size={15} /> Save
                  </button>
                  <button className="btn btn-ghost" style={{ padding:"8px 10px" }}
                    onClick={() => setEditId(null)}>
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="row-between">
                <div>
                  <span style={{ fontWeight:500 }}>{cat.name}</span>
                  <div style={{ fontSize:11, color:"var(--hint)", marginTop:2 }}>
                    {formatPrice(cat.default_user_price||0)} · reseller {formatPrice(cat.default_reseller_price||0)}
                  </div>
                </div>
                <div className="row" style={{ gap:4 }}>
                  <button className="btn btn-ghost"
                    disabled={moving || idx === 0} onClick={() => move(idx, -1)}
                    style={{ padding:6, opacity: idx === 0 ? 0.3 : 1 }}>
                    <ChevronUp size={14} />
                  </button>
                  <button className="btn btn-ghost"
                    disabled={moving || idx === cats.length - 1} onClick={() => move(idx, 1)}
                    style={{ padding:6, opacity: idx === cats.length - 1 ? 0.3 : 1 }}>
                    <ChevronDown size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding:6 }}
                    onClick={() => { setEditId(cat.id); setEditVal(cat.name); setEditUserPrice(cat.default_user_price||0); setEditResellerPrice(cat.default_reseller_price||0); }}>
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
