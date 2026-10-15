// Seasonal themes: picked by date, with a manual override for testing.
// Test in a desktop browser: open the app URL with ?theme=thingyan
// (also christmas, valentine, lights). Use ?theme=off to reset.
const KNOWN = ["thingyan", "christmas", "valentine", "lights"];
const FORCE = null; // e.g. "thingyan" to force a theme for everyone

function auto() {
  const d = new Date();
  const v = (d.getMonth() + 1) * 100 + d.getDate();
  if (v >= 410 && v <= 420) return "thingyan";
  if (v >= 1218 || v <= 103) return "christmas";
  if (v >= 210 && v <= 215) return "valentine";
  return null;
}

function pick() {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "off") localStorage.removeItem("themeOverride");
    else if (KNOWN.includes(q)) localStorage.setItem("themeOverride", q);
    const o = localStorage.getItem("themeOverride");
    if (KNOWN.includes(o)) return o;
  } catch (e) {}
  return FORCE || auto();
}

const theme = pick();
const root = document.documentElement;
if (theme) root.dataset.theme = theme;

let box = null;
let current = 0;

function sync() {
  const gfx = root.dataset.gfx;
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const n = !theme || calm ? 0 : gfx === "ultra" ? 22 : (gfx === "high" || !gfx) ? 14 : 0;
  if (n === current) return;
  current = n;
  if (box) { box.remove(); box = null; }
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

sync();
new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-gfx"] });
