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

function CopyMini({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={(e) => { e.stopPropagation(); haptic("light"); copyText(String(text)).then(() => { setOk(true); setTimeout(() => setOk(false), 1200); }); }}
      style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:6, padding:"4px 8px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color: ok ? "var(--success)" : "var(--hint)", fontSize:11, fontWeight:600, flexShrink:0 }}>
      {ok ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
    </button>
  );
}

// One line: label, value, and its own copy button
function Field({ label, value, swatch }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="row-between" style={{ gap:8, padding:"5px 0" }}>
      <div className="row" style={{ gap:8, minWidth:0, flex:1 }}>
        {swatch && <div style={{ width:20, height:20, borderRadius:5, background:swatch, border:"2px solid var(--border)", flexShrink:0 }} />}
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:10, color:"var(--hint)" }}>{label}</div>
          <div style={{ fontSize:13, fontWeight:700, wordBreak:"break-word", fontFamily: swatch ? "monospace" : undefined, userSelect:"text" }}>{value}</div>
        </div>
      </div>
      <CopyMini text={value} />
    </div>
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

      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>
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

      {(order.logo_name || order.logo_symbol || (order.add_username && order.tg_username)) && (
        <div style={{ borderTop:"1px solid var(--border)", marginTop:6, paddingTop:6 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"var(--accent)", letterSpacing:".08em" }}>BRAND TEXT</div>
          <Field label="Brand name" value={order.logo_name} />
          <Field label="Symbol / initials" value={order.logo_symbol} />
          {order.add_username && <Field label="Username on pack" value={order.tg_username ? `@${order.tg_username}` : ""} />}
        </div>
      )}

      {items.map((it, i) => {
        const d = it.designs || {};
        const texts = it.text_values || [];
        return (
          <div key={i} style={{ borderTop:"1px solid var(--border)", marginTop:8, paddingTop:8 }}>
            <div className="row-between" style={{ gap:8 }}>
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
                <CopyPill text={designBrief(it, i + 1)} label="All" />
              </div>
            </div>

            {texts.map((tv, j) => <Field key={j} label={tv.name || `Text ${j + 1}`} value={tv.value} />)}
            {it.custom_text && !texts.length && <Field label="Text" value={it.custom_text} />}
            <Field label="Primary color" value={it.primary_color} swatch={it.primary_color} />
            <Field label="Secondary color" value={it.secondary_color} swatch={it.secondary_color} />
            {(it.extra_colors || []).map((c, ci) => <Field key={ci} label={`Extra color ${ci + 1}`} value={c} swatch={c} />)}
          </div>
        );
      })}
    </div>
  );
}
