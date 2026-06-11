import { useState } from "react";
import { Check } from "lucide-react";
import AnimationPreview from "./AnimationPreview";
import { formatPrice } from "../lib/utils";
import { useApp } from "../context/AppContext";

/**
 * Design card for the design list page.
 * Shows animation only when clicked (to save resources).
 */
export default function DesignCard({ design, onToggle }) {
  const { isInCart, user } = useApp();
  const [playAnim, setPlayAnim] = useState(false);

  const selected   = isInCart(design.id);
  const price      = user?.role === "reseller" ? design.reseller_price : design.user_price;
  const hasAnim    = !!design.file_url;

  function handleClick() {
    setPlayAnim(true);
    onToggle?.(design);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background:    "var(--bg2)",
        borderRadius:  "var(--radius)",
        border:        `2px solid ${selected ? "var(--btn)" : "rgba(255,255,255,0.05)"}`,
        overflow:      "hidden",
        cursor:        "pointer",
        position:      "relative",
        transition:    "border-color .15s, transform .1s",
        transform:     selected ? "scale(1.01)" : "scale(1)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Selection check */}
      {selected && (
        <div style={{
          position:   "absolute", top:8, right:8,
          background: "var(--btn)", borderRadius:"50%",
          width:22, height:22,
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:2,
        }}>
          <Check size={13} color="#fff" strokeWidth={3} />
        </div>
      )}

      {/* Animation / placeholder */}
      <div style={{ aspectRatio:"1", background:"rgba(0,0,0,.2)", position:"relative" }}>
        {hasAnim ? (
          <AnimationPreview
            url={design.file_url}
            fileType={design.file_type}
            size="100%"
            loop
            play={playAnim}
            autoplay={false}
          />
        ) : (
          <div style={{ inset:0, position:"absolute", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>
            🎞
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 10px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
          {design.category_name && (
            <span style={{ fontSize:11, color:"var(--hint)", background:"rgba(255,255,255,.06)", padding:"2px 7px", borderRadius:99 }}>
              {design.category_name}
            </span>
          )}
          <span style={{ fontSize:13, fontWeight:700, color:"var(--accent2)", marginLeft:"auto" }}>
            {formatPrice(price)}
          </span>
        </div>

        {/* Color dots */}
        {(design.primary_color || design.secondary_color) && (
          <div style={{ display:"flex", gap:4, marginTop:6 }}>
            {design.primary_color && (
              <div style={{ width:12, height:12, borderRadius:"50%", background:design.primary_color, border:"1.5px solid rgba(255,255,255,.2)" }} />
            )}
            {design.secondary_color && (
              <div style={{ width:12, height:12, borderRadius:"50%", background:design.secondary_color, border:"1.5px solid rgba(255,255,255,.2)" }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
