import { useState, useEffect } from "react";
import { Film } from "lucide-react";
import api from "../lib/api";
import { hapticNotification, haptic, showConfirm } from "../lib/telegram";

let cache = null;
let inflight = null;
const subs = new Set();
const publish = () => subs.forEach((f) => f({ ...cache }));

function load(force) {
  if (inflight) return inflight;
  if (cache && !force) return Promise.resolve();
  inflight = api.get("/designs/gif-status/list")
    .then((r) => { cache = r.data || {}; publish(); })
    .catch(() => { if (!cache) cache = {}; })
    .finally(() => { inflight = null; });
  return inflight;
}

// Red = no GIF yet, green = GIF ready for the current file. Only for .tgs designs.
export default function GifButton({ design }) {
  const [map, setMap] = useState(cache || {});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    subs.add(setMap);
    load(false).then(() => { if (cache) setMap({ ...cache }); });
    return () => subs.delete(setMap);
  }, []);

  if (!design.file_url || design.file_type !== "tgs") return null;
  const done = !!map[design.id] && map[design.id] === design.file_url;
  const color = done ? "var(--success)" : "var(--danger)";

  async function click(e) {
    e.stopPropagation();
    if (busy) return;
    if (done && !(await showConfirm("This design already has a GIF. Render it again?"))) return;
    haptic("light");
    setBusy(true);
    try {
      await api.post(`/designs/${design.id}/render-gif`);
      cache = { ...(cache || {}), [design.id]: design.file_url };
      publish();
      hapticNotification("success");
    } catch (err) {
      hapticNotification("error");
      alert("Render failed: " + (err.response?.data?.detail || err.message));
    } finally { setBusy(false); }
  }

  return (
    <button className="btn btn-ghost" onClick={click}
      title={done ? "GIF ready (tap to render again)" : "No GIF yet. Tap to render"}
      style={{ padding: 6, color, border: `1px solid ${color}`, opacity: busy ? 0.6 : 1 }}>
      {busy ? <span style={{ fontSize: 12, fontWeight: 800 }}>…</span> : <Film size={16} />}
    </button>
  );
}
