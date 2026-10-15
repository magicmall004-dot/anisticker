import { useState, useEffect, useRef } from "react";
import { X, Plus, Check, Film } from "lucide-react";
import AnimationPreview from "./AnimationPreview";
import { formatPrice } from "../lib/utils";
import { useApp } from "../context/AppContext";
import { haptic } from "../lib/telegram";

const SPARKS = Array.from({ length: 10 }, (_, i) => i * 36);

export default function FullscreenPreview({ design, onClose, onToggle, selected }) {
  const { user } = useApp();
  const price = user?.role === "reseller" ? design.reseller_price : design.user_price;
  const [closing, setClosing] = useState(false);
  const [burst, setBurst] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function close(delay = 200) {
    if (closing) return;
    setClosing(true);
    timer.current = setTimeout(onClose, delay);
  }

  function handleAdd() {
    haptic("medium");
    onToggle(design);
    if (!selected) {
      setBurst(true);
      close(520);
    } else {
      close(200);
    }
  }

  const glow = design.type === "premium" ? "#FFD700" : (design.primary_color || "#04D9FF");
  const dots = [design.primary_color, design.secondary_color].filter(Boolean);

  return (
    <div className={`overlay ${closing ? "is-closing" : ""}`} onClick={() => close()} style={{ alignItems:"center" }}>
      <div className={`sheet fp-card ${closing ? "fp-out" : ""}`} onClick={(e) => e.stopPropagation()}
        style={{ borderRadius:"var(--radius-lg)", maxWidth:340, margin:"0 16px", "--g": glow }}>

        <div className="row-between" style={{ marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{design.category_name || "Design"}</div>
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => close()}>
            <X size={18} />
          </button>
        </div>

        <div className="fp-stage">
          <div className="fp-glow" />
          <div className="fp-frame">
            {design.file_url ? (
              <AnimationPreview url={design.file_url} fileType={design.file_type} size="100%" autoplay loop
                tintColor={design.type === "adaptive" ? getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() : null} />
            ) : (
              <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}><Film size={40}/></div>
            )}
          </div>
        </div>

        {dots.length > 0 && (
          <div className="fp-dots">
            {dots.map((c, i) => <span key={i} style={{ background:c }} />)}
          </div>
        )}

        {design.notice && design.notice.trim() && (
          <div className="notice-card">
            <div className="notice-title">ℹ️ Please read</div>
            <div className="notice-text">{design.notice}</div>
          </div>
        )}

        <div className="row-between" style={{ marginTop:14 }}>
          <div>
            <div style={{ fontSize:11, color:"var(--hint)" }}>Price</div>
            <div style={{ fontSize:20, fontWeight:800 }} className="glow-text">{formatPrice(price)}</div>
          </div>
          <div style={{ position:"relative" }}>
            {burst && (
              <div className="fp-burst">
                {SPARKS.map((a) => <i key={a} style={{ "--a": `${a}deg` }} />)}
              </div>
            )}
            <button
              className={`btn ${selected ? "btn-secondary" : "btn-primary"} ${burst ? "fp-pop" : ""}`}
              onClick={handleAdd}
              style={{ minWidth:140 }}
            >
              {selected ? <><Check size={16} /> Selected</> : <><Plus size={16} /> Add to Cart</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
