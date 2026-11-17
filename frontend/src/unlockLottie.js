const FAKE = "sh\u0430p\u0435s";
const MARKER = "\u26A0\uFE0F_PRO_GUARD_";
const isGuard = (o) => o && typeof o.nm === "string" && o.nm.startsWith(MARKER);

export function unlockLottie(o) {
  if (!o || typeof o !== "object") return o;
  if (Array.isArray(o)) {
    for (let i = o.length - 1; i >= 0; i--) isGuard(o[i]) ? o.splice(i, 1) : unlockLottie(o[i]);
    return o;
  }
  for (const k of Object.keys(o)) {
    unlockLottie(o[k]);
    if (k === FAKE) { o.shapes = o[k]; delete o[k]; }
  }
  return o;
}
