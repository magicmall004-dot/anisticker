// Theme priority: ?theme= preview (this browser) > owner setting > date.
// Owner setting values: "auto" | "off" | thingyan | christmas | valentine | lights
const KNOWN = ["thingyan", "christmas", "valentine", "lights"];
const root = document.documentElement;
let theme = null, box = null, current = 0;

function auto() {
  const d = new Date();
  const v = (d.getMonth() + 1) * 100 + d.getDate();
  if (v >= 410 && v <= 420) return "thingyan";
  if (v >= 1218 || v <= 103) return "christmas";
  if (v >= 210 && v <= 215) return "valentine";
  return null;
}

function resolve() {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "off") localStorage.removeItem("themeOverride");
    else if (KNOWN.includes(q)) localStorage.setItem("themeOverride", q);
    const o = localStorage.getItem("themeOverride");
    if (KNOWN.includes(o)) return o;
    const server = localStorage.getItem("themeServer") || "auto";
    if (server === "off") return null;
    if (KNOWN.includes(server)) return server;
  } catch (e) {}
  return auto();
}

function sync() {
  const gfx = root.dataset.gfx;
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const n = !theme || calm ? 0 : gfx === "ultra" ? 22 : (gfx === "high" || !gfx) ? 14 : 0;
  if (box) { box.remove(); box = null; }
  current = n;
  if (!n) return;
  box = document.createElement("div");
  box.className = "tp-box";
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    p.className = "tp";
    p.style.cssText =
      `--l:${(Math.random() * 100).toFixed(1)}%;` +
      `--d:${(8 + Math.random() * 8).toFixed(1)}s;` +
      `--dl:-${(Math.random() * 12).toFixed(1)}s;` +
      `--s:${(0.7 + Math.random() * 0.8).toFixed(2)};` +
      `--x:${Math.round(Math.random() * 80 - 40)}px;`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
}

function render() {
  const next = resolve();
  if (next) root.dataset.theme = next; else delete root.dataset.theme;
  const changed = next !== theme;
  theme = next;
  if (changed || !box) sync();
}

// Called after the app settings load (value comes from the owner panel)
export function applyTheme(value) {
  try { localStorage.setItem("themeServer", value || "auto"); } catch (e) {}
  render();
}

render();
new MutationObserver(() => { if (root.dataset.gfx) sync(); }).observe(root, { attributes: true, attributeFilter: ["data-gfx"] });
