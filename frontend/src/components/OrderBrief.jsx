import { useState } from "react";
import { Copy, Check, Download, Send, ClipboardList } from "lucide-react";
import { haptic, openTelegramLink } from "../lib/telegram";

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return new Promise((res) => {
    const t = document.createElement("textarea");
    t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) {}
    t.remove(); res();
  });
}

function fileExt(url) {
  const m = (url || "").split("?")[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "FILE";
}

function designBrief(item, n) {
  const d = item.designs || {};
  const L = [];
  L.push(`${n}. ${d.name || "Design"}${d.custom_id ? ` (#${d.custom_id})` : ""}${item.is_voucher_free ? " [FREE voucher]" : ""}`);
  if (d.file_url) L.push(`   Original file: ${d.file_url}`);
  if (item.primary_color) L.push(`   Primary color: ${item.primary_color}`);
  if (item.secondary_color) L.push(`   Secondary color: ${item.secondary_color}`);
  (item.extra_colors || []).forEach((c, i) => L.push(`   Extra color ${i + 1}: ${c}`));
  (item.text_values || []).forEach((tv) => L.push(`   ${tv.name || "Text"}: ${tv.value}`));
  if (item.custom_text && !(item.text_values || []).length) L.push(`   Text: ${item.custom_text}`);
  return L.join("\n");
}

function fullBrief(order) {
  const u = order.user || {};
  const L = [];
  L.push(`ORDER #${String(order.id).slice(0, 12)}`);
  L.push(`Date: ${new Date(order.created_at).toLocaleString()}`);
  L.push(`Customer: ${u.first_name || ""} ${u.last_name || ""}${u.username ? ` @${u.username}` : ""} (ID ${order.user_id})`);
  L.push("");
  L.push("BRAND");
  if (order.logo_type) L.push(`Logo: ${order.logo_type === "new" ? "create new" : "customer's own logo"}`);
  if (order.logo_name) L.push(`Brand name: ${order.logo_name}`);
  if (order.logo_symbol) L.push(`Symbol: ${order.logo_symbol}`);
  if (order.add_username) L.push(`Show username on pack: @${order.tg_username || ""}`);
  if (order.primary_color) L.push(`Brand primary: ${order.primary_color}`);
  if (order.secondary_color) L.push(`Brand secondary: ${order.secondary_color}`);
  if (order.logo_file_url) L.push(`Logo file: ${order.logo_file_url}`);
  L.push("");
  L.push(`DESIGNS (${(order.items || []).length})`);
  (order.items || []).forEach((it, i) => L.push(designBrief(it, i + 1)));
  return L.join("\n");
}

function CopyPill({ text, label }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn btn-secondary" style={{ padding:"6px 10px", fontSize:11 }}
      onClick={(e) => { e.stopPropagation(); haptic("light"); copyText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1400); }); }}>
      {ok ? <><Check size={12}/> Copied</> : <><Copy size={12}/> {label}</>}
    </button>
  );
}

export default function OrderBrief({ order }) {
  const items = order.items || [];
  const u = order.user || {};
  return (
    <div className="card" style={{ border:"1px solid rgba(var(--accent-rgb),0.3)" }}>
      <div className="row-between" style={{ marginBottom:10 }}>
        <div style={{ fontWeight:800, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <ClipboardList size={15} color="var(--accent)"/> Design brief
        </div>
        <CopyPill text={fullBrief(order)} label="Copy full brief" />
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
        {u.username && (
          <button className="btn btn-secondary" style={{ padding:"6px 10px", fontSize:11 }}
            onClick={() => openTelegramLink(`https://t.me/${u.username}`)}>
            <Send size={12}/> Chat @{u.username}
          </button>
        )}
        {order.logo_file_url && (
          <a className="btn btn-secondary" style={{ padding:"6px 10px", fontSize:11, textDecoration:"none" }}
            href={order.logo_file_url} target="_blank" rel="noreferrer">
            <Download size={12}/> Logo file ({fileExt(order.logo_file_url)})
          </a>
        )}
      </div>

      {items.map((it, i) => {
        const d = it.designs || {};
        return (
          <div key={i} className="row-between" style={{ gap:8, padding:"8px 0", borderTop:"1px solid var(--border)" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:12 }}>
                {i + 1}. {d.name || "Design"} {d.custom_id ? <span style={{ color:"var(--accent)", fontFamily:"monospace" }}>#{d.custom_id}</span> : null}
              </div>
              {it.is_voucher_free && <div style={{ fontSize:10, color:"#FFD700", fontWeight:700 }}>FREE (voucher)</div>}
            </div>
            <div className="row" style={{ gap:6, flexShrink:0 }}>
              {d.file_url && (
                <a className="btn btn-secondary" style={{ padding:"6px 10px", fontSize:11, textDecoration:"none" }}
                  href={d.file_url} target="_blank" rel="noreferrer">
                  <Download size={12}/> {fileExt(d.file_url)}
                </a>
              )}
              <CopyPill text={designBrief(it, i + 1)} label="Copy" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
