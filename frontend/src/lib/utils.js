// ── Color helpers ─────────────────────────────────────────────

/** hex → { r, g, b } each 0-255 */
export function hexToRgb(hex) {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** { r, g, b } → hex string #rrggbb */
export function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** { r, g, b } → { h 0-360, s 0-100, v 0-100 } */
export function rgbToHsv({ r, g, b }) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(max * 100) };
}

/** { h 0-360, s 0-100, v 0-100 } → { r, g, b } */
export function hsvToRgb({ h, s, v }) {
  const S = s / 100, V = v / 100;
  const c = V * S, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = V - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r=c; g=x; b=0; }
  else if (h < 120) { r=x; g=c; b=0; }
  else if (h < 180) { r=0; g=c; b=x; }
  else if (h < 240) { r=0; g=x; b=c; }
  else if (h < 300) { r=x; g=0; b=c; }
  else              { r=c; g=0; b=x; }
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
}

/** hex → hsv */
export function hexToHsv(hex) { return rgbToHsv(hexToRgb(hex)); }

/** hsv → hex */
export function hsvToHex(hsv) { return rgbToHex(hsvToRgb(hsv)); }

/** Check if a hex string is valid */
export function isValidHex(hex) { return /^#[0-9a-fA-F]{6}$/.test(hex); }

// ── Price helpers ─────────────────────────────────────────────

export function formatPrice(n) {
  return Number(n).toLocaleString() + " MMK";
}

// ── Misc ──────────────────────────────────────────────────────

export function truncate(str, len = 24) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function statusColor(status) {
  return {
    pending:   "#f59e0b",
    accepted:  "#3b82f6",
    cancelled: "#ef4444",
    done:      "#22c55e",
  }[status] || "#6b7280";
}

export function statusLabel(status) {
  return {
    pending:   "Pending",
    accepted:  "Accepted",
    cancelled: "Cancelled",
    done:      "Done",
  }[status] || status;
}
