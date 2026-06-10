import { useState, useEffect } from "react";
import { hexToHsv, hsvToHex, isValidHex } from "../lib/utils";

/**
 * Compact color picker with:
 *  - Live hex input
 *  - Hue, Saturation, Value sliders
 *  - Color swatch preview
 *
 * Props:
 *  value    – hex string "#rrggbb"
 *  onChange – (hex) => void
 *  label    – optional label string
 */
export default function ColorPicker({ value = "#000000", onChange, label }) {
  const [hex, setHex] = useState(value);
  const [hsv, setHsv] = useState(() => hexToHsv(value || "#000000"));

  // Sync when parent changes value
  useEffect(() => {
    if (value && isValidHex(value) && value !== hex) {
      setHex(value);
      setHsv(hexToHsv(value));
    }
  }, [value]);

  function applyHex(h) {
    setHex(h);
    if (isValidHex(h)) {
      setHsv(hexToHsv(h));
      onChange?.(h);
    }
  }

  function applyHsv(newHsv) {
    const merged = { ...hsv, ...newHsv };
    setHsv(merged);
    const h = hsvToHex(merged);
    setHex(h);
    onChange?.(h);
  }

  const previewBg = isValidHex(hex) ? hex : "#000000";

  // Generate gradient for sliders
  const hueGradient = "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)";
  const satGradient = `linear-gradient(to right, hsl(${hsv.h},0%,${hsv.v}%), hsl(${hsv.h},100%,${hsv.v * 0.5}%))`;
  const valGradient = `linear-gradient(to right, #000, hsl(${hsv.h},${hsv.s}%,50%))`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {label && <div className="label">{label}</div>}

      {/* Swatch + hex input */}
      <div className="row">
        <div className="color-swatch" style={{ background: previewBg, width:36, height:36 }} />
        <input
          className="input"
          value={hex}
          onChange={(e) => applyHex(e.target.value)}
          placeholder="#rrggbb"
          maxLength={7}
          style={{ fontFamily:"monospace", letterSpacing:".05em" }}
        />
      </div>

      {/* HSV sliders */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <SliderRow label="H" value={hsv.h} min={0} max={360} gradient={hueGradient}
          onChange={(v) => applyHsv({ h: v })} />
        <SliderRow label="S" value={hsv.s} min={0} max={100} gradient={satGradient}
          onChange={(v) => applyHsv({ s: v })} />
        <SliderRow label="V" value={hsv.v} min={0} max={100} gradient={valGradient}
          onChange={(v) => applyHsv({ v: v })} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, gradient, onChange }) {
  return (
    <div className="row" style={{ gap:8 }}>
      <span style={{ fontSize:11, fontWeight:600, color:"var(--hint)", width:12 }}>{label}</span>
      <div style={{ flex:1, position:"relative", height:14 }}>
        <div style={{
          position:"absolute", top:"50%", left:0, right:0, height:8,
          transform:"translateY(-50%)",
          borderRadius:4,
          background: gradient,
        }} />
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position:"absolute", inset:0, opacity:0,
            width:"100%", cursor:"pointer", margin:0,
          }}
        />
        {/* Thumb indicator */}
        <div style={{
          position:"absolute",
          left: `calc(${((value - min) / (max - min)) * 100}% - 8px)`,
          top:"50%", transform:"translateY(-50%)",
          width:16, height:16,
          borderRadius:"50%",
          background:"#fff",
          border:"2px solid rgba(0,0,0,.3)",
          boxShadow:"0 1px 4px rgba(0,0,0,.4)",
          pointerEvents:"none",
        }} />
      </div>
      <span style={{ fontSize:11, color:"var(--hint)", width:28, textAlign:"right" }}>{value}</span>
    </div>
  );
}
