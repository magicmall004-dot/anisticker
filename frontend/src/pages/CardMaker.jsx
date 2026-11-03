import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, hapticNotification } from "../lib/telegram";

const FRAME_SRC = `${import.meta.env.BASE_URL}cardmaker.html`;

// What the sandboxed card page may ask for. It never sees the login token and can never send a price.
const OPS = {
  gifts:   ()  => api.get("/cardmaker/gifts"),
  models:  (p) => api.get(`/cardmaker/models/${encodeURIComponent(String(p.gift).slice(0, 80))}`),
  preview: (p) => api.post("/cardmaker/preview", { config: p.config, animated: !!p.animated }),
  thumbs:  (p) => api.post("/cardmaker/thumbs", { config: p.config }),
  autofit: (p) => api.post("/cardmaker/autofit", { config: p.config }),
  order:   (p) => api.post("/cardmaker/order", { config: p.config, idem_key: String(p.idem_key) }),
};

export default function CardMaker() {
  const navigate = useNavigate();
  const { user } = useApp();
  const frame = useRef(null);
  const [info, setInfo] = useState(null);
  const [prices, setPrices] = useState(null);   // owner only
  const [saving, setSaving] = useState(false);
  const kvKey = (k) => `mm_cm_${user?.id}_${k}`;

  const pushInfo = useCallback((i) => {
    frame.current?.contentWindow?.postMessage({ type: "info", info: i }, "*");
  }, []);

  const loadInfo = useCallback(async () => {
    const r = await api.get("/cardmaker/info");
    setInfo(r.data);
    pushInfo(r.data);
    return r.data;
  }, [pushInfo]);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    loadInfo().catch(() => {});
    if (user?.role === "owner") api.get("/cardmaker/prices").then((r) => setPrices(r.data)).catch(() => {});
    return hideBackButton;
  }, []);

  useEffect(() => {
    async function onMessage(e) {
      const w = frame.current?.contentWindow;
      const m = e.data;
      if (!w || e.source !== w || !m || m.type !== "req" || typeof m.id !== "number") return;
      const reply = (ok, data, error) => w.postMessage({ type: "res", id: m.id, ok, data, error }, "*");
      try {
        if (m.op === "kv_get") {
          return reply(true, localStorage.getItem(kvKey(String(m.payload?.key).slice(0, 20))));
        }
        if (m.op === "kv_set") {
          const v = String(m.payload?.value ?? "");
          if (v.length > 400_000) throw new Error("Too large to save");
          localStorage.setItem(kvKey(String(m.payload?.key).slice(0, 20)), v);
          return reply(true, true);
        }
        const fn = OPS[m.op];
        if (!fn) throw new Error("Unknown request");
        const res = await fn(m.payload || {});
        if (m.op === "order") { hapticNotification("success"); loadInfo().catch(() => {}); }
        reply(true, res.data);
      } catch (err) {
        if (m.op === "order") hapticNotification("error");
        reply(false, null, err.response?.data?.detail || err.message || "Something went wrong");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [user?.id]);

  async function savePrices() {
    setSaving(true);
    try { await api.put("/cardmaker/prices", { user: Number(prices.user), reseller: Number(prices.reseller) }); await loadInfo(); }
    catch (e) { alert(e.response?.data?.detail || e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => navigate(-1)}><ChevronLeft size={22} /></button>
        <div className="page-title">Wallet Card Maker</div>
      </div>
      <div className="page-body" style={{ paddingBottom: 90 }}>
        {info && (
          <div className="card" style={{ padding: "10px 14px", fontSize: 13 }}>
            <div className="row-between">
              <span>{info.free ? "Free for you ✨" : `Price: ${formatPrice(info.price)}`}</span>
              <span style={{ color: "var(--hint)" }}>Balance: {formatPrice(info.balance)}</span>
            </div>
          </div>
        )}
        {prices && (
          <div className="card" style={{ padding: "10px 14px" }}>
            <div style={{ fontSize: 12, color: "var(--hint)", marginBottom: 6 }}>Owner: card prices (MMK)</div>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" type="number" min="0" value={prices.user ?? ""} onChange={(e) => setPrices({ ...prices, user: e.target.value })} placeholder="User" />
              <input className="input" type="number" min="0" value={prices.reseller ?? ""} onChange={(e) => setPrices({ ...prices, reseller: e.target.value })} placeholder="Reseller" />
              <button className="btn btn-primary" disabled={saving} onClick={savePrices}>{saving ? "…" : "Save"}</button>
            </div>
          </div>
        )}
        <iframe
          ref={frame}
          title="Wallet card maker"
          src={FRAME_SRC}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          onLoad={() => info && pushInfo(info)}
          style={{ width: "100%", height: "calc(100dvh - 170px)", minHeight: 520, border: 0, borderRadius: 14, background: "transparent" }}
        />
        <div style={{ fontSize: 11, color: "var(--hint)", textAlign: "center", marginTop: 8 }}>
          Gift stickers &amp; data: thanks to @GiftChanges for this API (api.changes.tg)
        </div>
      </div>
    </div>
  );
}
