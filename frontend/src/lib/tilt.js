// 3D tilt + glare on design cards. High/Ultra graphics only.
const root = document.documentElement;
const MAX = 9; // degrees
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const calm = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const enabled = () => (root.dataset.gfx === "high" || root.dataset.gfx === "ultra") && !calm();

/* ---- press / hover tilt (works on every device) ---- */
let cur = null;
function setCard(card, e) {
  const r = card.getBoundingClientRect();
  if (!r.width) return;
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  card.classList.add("tilting");
  card.style.setProperty("--prx", `${((0.5 - py) * 2 * MAX).toFixed(1)}deg`);
  card.style.setProperty("--pry", `${((px - 0.5) * 2 * MAX).toFixed(1)}deg`);
  card.style.setProperty("--pgx", `${(px * 100).toFixed(0)}%`);
  card.style.setProperty("--pgy", `${(py * 100).toFixed(0)}%`);
}
function clearCard(card) {
  card.classList.remove("tilting");
  ["--prx", "--pry", "--pgx", "--pgy"].forEach((k) => card.style.removeProperty(k));
}
function track(e) {
  if (!enabled()) { if (cur) { clearCard(cur); cur = null; } return; }
  const card = e.target.closest ? e.target.closest(".design-card:not(.skeleton-card)") : null;
  if (card !== cur) { if (cur) clearCard(cur); cur = card; }
  if (cur) setCard(cur, e);
  startSensor();
}
function release() { if (cur) { clearCard(cur); cur = null; } }
document.addEventListener("pointerdown", track, true);
document.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) track(e); }, true);
document.addEventListener("pointerup", release, true);
document.addEventListener("pointercancel", release, true);
document.addEventListener("mouseleave", release, true);

/* ---- motion sensor tilt (phones) ---- */
let bBase = null, gBase = null, raf = 0, gx = 0, gy = 0, started = false;
function push() {
  raf = 0;
  const grids = document.getElementsByClassName("design-grid");
  for (let i = 0; i < grids.length; i++) {
    const g = grids[i];
    g.classList.add("gyro-on");
    g.style.setProperty("--grx", `${(-gy).toFixed(1)}deg`);
    g.style.setProperty("--gry", `${gx.toFixed(1)}deg`);
    g.style.setProperty("--ggx", `${(50 + gx * 4).toFixed(0)}%`);
    g.style.setProperty("--ggy", `${(35 + gy * 4).toFixed(0)}%`);
  }
}
function onOrient(beta, gamma) {
  if (!enabled() || beta == null || gamma == null) return;
  if (bBase === null) { bBase = beta; gBase = gamma; }
  // the "flat" position slowly follows the phone, so holding it still returns to neutral
  bBase += (beta - bBase) * 0.03;
  gBase += (gamma - gBase) * 0.03;
  const ny = clamp((beta - bBase) * 0.5, -MAX, MAX);
  const nx = clamp((gamma - gBase) * 0.5, -MAX, MAX);
  if (Math.abs(nx - gx) < 0.3 && Math.abs(ny - gy) < 0.3) return;
  gx = nx; gy = ny;
  if (!raf) raf = requestAnimationFrame(push);
}
function startSensor() {
  if (started) return;
  started = true;
  try {
    const needsPermission = typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function";
    if (!needsPermission) {
      window.addEventListener("deviceorientation", (e) => onOrient(e.beta, e.gamma));
      return;
    }
    // iPhone: ask Telegram's own sensor API (no browser permission prompt)
    const tg = window.Telegram && window.Telegram.WebApp;
    const D = tg && tg.DeviceOrientation;
    if (D && D.start) {
      tg.onEvent("deviceOrientationChanged", () => onOrient(D.beta * 57.2958, D.gamma * 57.2958));
      D.start({ refresh_rate: 60 });
    }
  } catch (e) { /* sensor is optional */ }
}
