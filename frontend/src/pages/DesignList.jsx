import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Settings } from "lucide-react";
import { getDesigns, getCategories } from "../lib/api";
import { useApp } from "../context/AppContext";
import { haptic } from "../lib/telegram";
import DesignCard from "../components/DesignCard";
import CartBar from "../components/CartBar";

export default function DesignList() {
  const { user, addToCart, removeFromCart, isInCart, cart } = useApp();
  const navigate = useNavigate();

  const [designs,    setDesigns]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat,  setActiveCat]  = useState(null);   // null = All
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([getDesigns(), getCategories()]);
      setDesigns(d);
      setCategories(c);
    } finally {
      setLoading(false);
    }
  }

  const filtered = activeCat
    ? designs.filter((d) => d.category_id === activeCat)
    : designs;

  function toggleDesign(design) {
    haptic("light");
    if (isInCart(design.id)) {
      removeFromCart(design.id);
    } else {
      addToCart(design);
    }
  }

  const isOwner = user?.role === "owner";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ fontSize:22 }}>✨</div>
        <div className="page-title">AniSticker</div>
        {isOwner && (
          <button className="btn btn-ghost" style={{ padding:"8px" }}
            onClick={() => navigate("/owner")}>
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div style={{ padding:"10px 16px 0" }}>
          <div className="scroll-row">
            <div
              className={`pill ${!activeCat ? "active" : ""}`}
              onClick={() => setActiveCat(null)}
            >
              All
            </div>
            {categories.map((c) => (
              <div
                key={c.id}
                className={`pill ${activeCat === c.id ? "active" : ""}`}
                onClick={() => setActiveCat(c.id === activeCat ? null : c.id)}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User info banner */}
      {user && (
        <div style={{ padding:"12px 16px 0" }}>
          <div style={{
            background:"rgba(124,58,237,.12)",
            border:"1px solid rgba(124,58,237,.25)",
            borderRadius:"var(--radius-sm)",
            padding:"8px 12px",
            fontSize:13, color:"var(--accent2)",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span>👋</span>
            <span>Hi <b>{user.first_name}</b>
              {user.role !== "user" && (
                <> &nbsp;·&nbsp; <span style={{ textTransform:"capitalize" }}>{user.role}</span></>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Design grid */}
      <div style={{ padding:"14px 16px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Layers size={40} />
            <div style={{ fontWeight:600 }}>No designs yet</div>
            <div style={{ fontSize:13 }}>
              {isOwner ? "Go to owner panel to add designs" : "Check back soon!"}
            </div>
          </div>
        ) : (
          <div className="design-grid">
            {filtered.map((design) => (
              <DesignCard key={design.id} design={design} onToggle={toggleDesign} />
            ))}
          </div>
        )}
      </div>

      {/* Floating cart */}
      {cart.length > 0 && <CartBar />}
    </div>
  );
}
