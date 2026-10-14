import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return; }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => { setMounted(false); setClosing(false); }, 220);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = mounted ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className={`overlay ${closing ? "is-closing" : ""}`} onClick={onClose}>
      <div className={`sheet ${closing ? "is-closing" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div style={{
          width:36, height:4, borderRadius:2,
          background:"rgba(255,255,255,.2)",
          margin:"-8px auto 16px",
        }} />
        <div className="row-between" style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{title}</div>
          <button className="btn btn-ghost" style={{ padding:6 }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
