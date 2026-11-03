import { useState, useEffect } from "react";
import { Star, Crown, Save } from "lucide-react";
import api from "../lib/api";
import { formatPrice } from "../lib/utils";
import { hapticNotification, showConfirm } from "../lib/telegram";

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

      <LimitsCard onSaved={load} />

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
                    <input className="input" type="number" min="50" max="50000" value={r.min_qty ?? 50}
                      onChange={(e) => edit(r.code, { min_qty: e.target.value })} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <div className="label">Maximum Stars</div>
                    <input className="input" type="number" min="50" max="50000" value={r.max_qty ?? 1000}
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

      <StarTest rows={rows} />
    </div>
  );
}

function StarTest({ rows }) {
  const [code, setCode] = useState("stars");
  const [qty, setQty] = useState(50);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  async function run() {
    if (busy) return;
    if (!(await showConfirm("This buys for your own @username and charges your own balance. Continue?"))) return;
    setBusy(true); setOut(null);
    try {
      const r = await api.post("/star-shop/buy", { code, qty: Number(qty) });
      setOut({ ok: true, ...r.data }); hapticNotification("success");
    } catch (e) {
      setOut({ ok: false, message: e.response?.data?.detail || e.message }); hapticNotification("error");
    } finally { setBusy(false); }
  }
  return (
    <div className="card" style={{ border: "1px dashed rgba(255,215,0,0.4)" }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Test purchase (owner only)</div>
      <div style={{ fontSize: 12, color: "var(--hint)", marginBottom: 10, lineHeight: 1.6 }}>
        Buys for your own @username. While the delivery service is in test mode, your balance is charged and refunded right away.
        Works even when a product is switched off.
      </div>
      <select className="input" value={code} onChange={(e) => setCode(e.target.value)} style={{ color: "var(--text)", background: "rgba(255,255,255,.07)" }}>
        {rows.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
      </select>
      {code === "stars" && (
        <input className="input" type="number" min="50" max="50000" value={qty} onChange={(e) => setQty(e.target.value)} style={{ marginTop: 8 }} />
      )}
      <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} disabled={busy} onClick={run}>
        {busy ? "Working…" : "Run test purchase"}
      </button>
      {out && (
        <div style={{ marginTop: 10, fontSize: 13, color: out.ok ? "var(--success)" : "var(--danger)" }}>
          {out.message}{out.status ? ` (${out.status})` : ""}
        </div>
      )}
    </div>
  );
}

const LIMIT_FIELDS = [
  ["max_stars", "Maximum Stars in one order", "Up to 50,000"],
  ["min_stars", "Minimum Stars in one order", "At least 50"],
  ["user_day_stars", "Maximum Stars per customer per day", "Must be at least the per-order maximum"],
  ["user_day_premium", "Premium orders per customer per day", "1 to 5"],
  ["day_cap_ton", "Daily spending cap, all customers", "In your wallet coin, as your star bot shows it"],
  ["min_reserve_ton", "Always keep this much in the wallet", "Orders are refused below it"],
  ["est_ton_per_star", "Estimated cost per Star (0 = off)", "Refuses orders the wallet cannot cover"],
];

function LimitsCard({ onSaved }) {
  const [lim, setLim] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get("/star-shop/limits").then((r) => setLim(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "The delivery service is not reachable"));
  }, []);
  async function save() {
    if (!(await showConfirm("Change the delivery limits? They protect your wallet."))) return;
    setSaving(true); setErr("");
    try {
      const payload = Object.fromEntries(Object.entries(lim).map(([k, v]) => [k, Number(v)]));
      const r = await api.put("/star-shop/limits", payload);
      setLim(r.data); hapticNotification("success"); if (onSaved) onSaved();
    } catch (e) {
      setErr(e.response?.data?.detail || e.message); hapticNotification("error");
    } finally { setSaving(false); }
  }
  if (!lim) return err ? <div className="card" style={{ color: "var(--danger)", fontSize: 13 }}>{err}</div> : null;
  return (
    <div className="card" style={{ border: "1px solid rgba(255,215,0,0.35)" }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Delivery limits</div>
      <div style={{ fontSize: 12, color: "var(--hint)", lineHeight: 1.6 }}>
        These protect your Fragment wallet. An order that breaks a limit is refused before anything is bought.
      </div>
      {LIMIT_FIELDS.map(([k, label, hint]) => (
        <div className="field" key={k} style={{ marginTop: 10 }}>
          <div className="label">{label}</div>
          <input className="input" type="number" step="any" value={lim[k] ?? ""} onChange={(e) => setLim({ ...lim, [k]: e.target.value })} />
          <div style={{ fontSize: 11, color: "var(--hint)", marginTop: 2 }}>{hint}</div>
        </div>
      ))}
      {err && <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{err}</div>}
      <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save limits"}
      </button>
    </div>
  );
}
