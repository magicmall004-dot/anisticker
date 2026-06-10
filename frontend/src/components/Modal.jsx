import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Bottom-sheet modal overlay.
 * Props:
 *  open     – boolean
 *  onClose  – () => void
 *  title    – string
 *  children – React node
 */
export default function Modal({ open, onClose, title, children }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div style={{
          width:36, height:4, borderRadius:2,
          background:"rgba(255,255,255,.2)",
          margin:"-8px auto 16px",
        }} />

        {/* Header */}
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
