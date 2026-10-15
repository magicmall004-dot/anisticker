import { useState, useEffect } from "react";
import { getAppSettings, updateAppSettings } from "../lib/api";
import { applyTheme } from "../lib/theme";
import { hapticNotification, haptic } from "../lib/telegram";

const OPTIONS = [
  { id:"auto",      label:"Auto (by date)", dot:"linear-gradient(135deg,#04D9FF,#7c3aed)" },
  { id:"off",       label:"Off (default)",  dot:"#8b899c" },
  { id:"thingyan",  label:"Thingyan",       dot:"linear-gradient(135deg,#FFC93C,#06B6D4)" },
  { id:"christmas", label:"Christmas",      dot:"linear-gradient(135deg,#ff5c6a,#22c55e)" },
  { id:"valentine", label:"Valentine",      dot:"linear-gradient(135deg,#FF4D94,#a855f7)" },
  { id:"lights",    label:"Lights festival",dot:"linear-gradient(135deg,#FFB020,#ef4444)" },
];

export default function ThemePicker() {
  const [value, setValue] = useState("auto");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getAppSettings().then((s) => setValue(s.app_theme || "auto")).catch(() => {}); }, []);

  async function pick(id) {
    if (id === value || saving) return;
    haptic("light");
    setSaving(true);
    try {
      await updateAppSettings({ app_theme: id });
      setValue(id);
      applyTheme(id);
      hapticNotification("success");
    } catch (e) {
      hapticNotification("error");
      alert("Failed: " + (e.response?.data?.detail || e.message));
    } finally { setSaving(false); }
  }

  return (
    <div className="card">
      <div style={{ fontWeight:700, marginBottom:4 }}>App Theme</div>
      <div style={{ fontSize:12, color:"var(--hint)", marginBottom:10 }}>Applies to every customer the next time they open the app.</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {OPTIONS.map((o) => (
          <button key={o.id} onClick={() => pick(o.id)} className="btn btn-secondary"
            style={{ justifyContent:"flex-start", gap:8, padding:"10px", fontSize:12,
              border: value===o.id ? "1.5px solid var(--accent)" : undefined,
              boxShadow: value===o.id ? "0 0 12px rgba(var(--accent-rgb),0.35)" : "none" }}>
            <span style={{ width:14, height:14, borderRadius:"50%", background:o.dot, flexShrink:0 }} />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
