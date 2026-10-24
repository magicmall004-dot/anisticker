import { useState, useEffect } from "react";
import { Star, Crown, Save } from "lucide-react";
import api from "../lib/api";
import { formatPrice } from "../lib/utils";
import { hapticNotification } from "../lib/telegram";

const cost = (r, q) => Math.ceil(Math.round(Number(r.price_mmk || 0) * q / (r.unit_qty || 1) * 1e6) / 1e6);

export default function OwnerStars() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setRows((await api.get("/star-shop/products")).data); } finally { setLoading(false); }
  }
  const edit = (code, patch) => setRows((p) => p.map((r) => (r.code === code ? { ...r, ...patch } : r)));

  async function save(r) {
    setSaving(r.code);
    try {
      await api.put(`/star-shop/products/${r.code}`, {
        price_mmk: Number(r.price_mmk) || 0,
        is_active: !!r.is_active,
        ...(r.kind === "STARS" ? { min_qty: Number(r.min_qty), max_qty: Number(r.max_qty) } : {}),
      });
      hapticNotification("success");
    } catch (e) {
      hapticNotification("error");
      alert("Failed: " + (e.response?.data?.detail || e.message));
      await load();
    } finally { setSaving(null); }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>;

  return (
    <div className="page-body">
      <div className="card-glow">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Stars & Premium prices</div>
        <div style={{ fontSize: 12, color: "var(--hint)" }}>
          Customers see a product only when it is switched on and its price is above 0. Prices are in Ks (MMK).
        </div>
      </div>

      {rows.map((r) => {
        const stars = r.kind === "STARS";
        const Icon = stars ? Star : Crown;
        return (
          <div key={r.code} className="card" style={{ border: r.is_active ? "1px solid rgba(34,197,94,0.4)" : undefined }}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="row" style={{ gap: 8, fontWeight: 800 }}>
                <Icon size={18} color={stars ? "var(--accent)" : "#FFD700"} /> {r.label}
              </div>
              <label className="toggle">
                <input type="checkbox" checked={!!r.is_active} onChange={(e) => edit(r.code, { is_active: e.target.checked })} />
                <div className="toggle-track" /><div className="toggle-thumb" />
              </label>
            </div>

            <div className="field">
              <div className="label">{stars ? `Price for ${r.unit_qty} Stars (Ks)` : "Price (Ks)"}</div>
              <input className="input" type="number" min="0" value={r.price_mmk ?? 0}
                onChange={(e) => edit(r.code, { price_mmk: e.target.value })} style={{ fontSize: 18, fontWeight: 700 }} />
            </div>

            {stars && (
              <>
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <div className="label">Minimum Stars</div>
                    <input className="input" type="number" min="50" max="1000" value={r.min_qty ?? 50}
                      onChange={(e) => edit(r.code, { min_qty: e.target.value })} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <div className="label">Maximum Stars</div>
                    <input className="input" type="number" min="50" max="1000" value={r.max_qty ?? 1000}
                      onChange={(e) => edit(r.code, { max_qty: e.target.value })} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--hint)", marginTop: 8, lineHeight: 1.7 }}>
                  {[50, 100, 500, 1000].map((q) => (
                    <div key={q}>{q} Stars = <b style={{ color: "var(--text)" }}>{formatPrice(cost(r, q))}</b></div>
                  ))}
                </div>
              </>
            )}

            <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} disabled={saving === r.code} onClick={() => save(r)}>
              <Save size={15} /> {saving === r.code ? "Saving…" : "Save"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
