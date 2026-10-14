import { useState, useEffect } from "react";
import { X, Plus, Check, Film } from "lucide-react";
import AnimationPreview from "./AnimationPreview";
import { formatPrice } from "../lib/utils";
import { useApp } from "../context/AppContext";
import { haptic } from "../lib/telegram";

export default function FullscreenPreview({ design, onClose, onToggle, selected }) {
  const { user } = useApp();
  const price = user?.role === "reseller" ? design.reseller_price : design.user_price;
  const [animatedIn, setAnimatedIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimatedIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems:"center" }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius:"var(--radius-lg)", maxWidth:340, margin:"0 16px",
          transform: animatedIn ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
          opacity: animatedIn ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(.2,.9,.3,1), opacity 0.3s ease",
        }}>

        <div className="row-between" style={{ marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{design.category_name || "Design"}</div>
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          aspectRatio:"1", borderRadius:"var(--radius)",
          background:"var(--bg)", overflow:"hidden",
          border:"1px solid rgba(4,217,255,0.15)",
        }}>
          {design.file_url ? (
            <AnimationPreview url={design.file_url} fileType={design.file_type} size="100%" autoplay loop
              tintColor={design.type === "adaptive" ? getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() : null} />
          ) : (
            <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60 }}><Film size={40}/></div>
          )}
        </div>

        <div className="row-between" style={{ marginTop:16 }}>
          <div>
            <div style={{ fontSize:11, color:"var(--hint)" }}>Price</div>
            <div style={{ fontSize:20, fontWeight:800 }} className="glow-text">{formatPrice(price)}</div>
          </div>
          <button
            className={`btn ${selected ? "btn-secondary" : "btn-primary"}`}
            onClick={() => { haptic("medium"); onToggle(design); onClose(); }}
            style={{ minWidth:140 }}
          >
            {selected ? <><Check size={16} /> Selected</> : <><Plus size={16} /> Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}
