import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, Plus, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { uploadLogo } from "../lib/api";
import { showBackButton, hideBackButton, haptic } from "../lib/telegram";
import ColorPicker from "../components/ColorPicker";
import AnimationPreview from "../components/AnimationPreview";
import { formatPrice } from "../lib/utils";
import { useEffect } from "react";

export default function DesignSetup() {
  const { cart, updateCartItem, user, cartTotal } = useApp();
  const navigate = useNavigate();

  // Logo setup
  const [logoMode,    setLogoMode]    = useState(null);   // null | "new" | "existing"
  const [logoName,    setLogoName]    = useState("");
  const [logoSymbol,  setLogoSymbol]  = useState("");
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoUrl,     setLogoUrl]     = useState(null);
  const [logoFileType,setLogoFileType]= useState(null);
  const [uploading,   setUploading]   = useState(false);

  // Global options
  const [addUsername, setAddUsername] = useState(false);
  const [tgUsername,  setTgUsername]  = useState("");
  const [primaryColor,   setPrimary]  = useState("#000000");
  const [secondaryColor, setSecondary]= useState("#ffffff");

  // Which design's color panel is open
  const [expandedId, setExpandedId]  = useState(null);
  const logoInputRef = useRef();

  useEffect(() => {
    showBackButton(() => navigate(-1));
    return hideBackButton;
  }, []);

  if (cart.length === 0) {
    navigate("/");
    return null;
  }

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadLogo(file);
      setLogoUrl(res.url);
      setLogoFileType(res.file_type);
      setLogoFile(file.name);
    } finally {
      setUploading(false);
    }
  }

  function canProceed() {
    if (!logoMode) return false;
    if (logoMode === "new" && (!logoName.trim() || !logoSymbol.trim())) return false;
    if (logoMode === "existing" && !logoUrl) return false;
    if (addUsername && !tgUsername.trim()) return false;
    // All designs with has_text must have customText
    const missing = cart.some((i) => i.design.has_text && !i.customText?.trim());
    if (missing) return false;
    return true;
  }

  function proceed() {
    haptic("medium");
    navigate("/payment", { state: {
      primaryColor, secondaryColor,
      addUsername, tgUsername,
      logoMode, logoName, logoSymbol, logoUrl, logoFileType,
    }});
  }

  const total = cartTotal(user?.role);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">Design Setup</div>
      </div>

      <div className="page-body">

        {/* ── Logo Section ── */}
        <div>
          <div className="section-title">Brand Logo</div>
        </div>

        {!logoMode ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button className="btn btn-secondary btn-full" onClick={() => setLogoMode("new")}
              style={{ flexDirection:"column", gap:4, padding:"16px 10px" }}>
              <Plus size={20} />
              <span style={{ fontSize:13 }}>Create New</span>
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => { setLogoMode("existing"); logoInputRef.current?.click(); }}
              style={{ flexDirection:"column", gap:4, padding:"16px 10px" }}>
              <Upload size={20} />
              <span style={{ fontSize:13 }}>Import Logo</span>
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="row-between" style={{ marginBottom:12 }}>
              <div style={{ fontWeight:600 }}>
                {logoMode === "new" ? "New Logo" : "Imported Logo"}
              </div>
              <button className="btn btn-ghost" style={{ padding:4 }}
                onClick={() => { setLogoMode(null); setLogoUrl(null); setLogoFile(null); }}>
                <X size={16} />
              </button>
            </div>

            {logoMode === "new" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div className="field">
                  <div className="label">Brand Name</div>
                  <input className="input" value={logoName} onChange={e=>setLogoName(e.target.value)}
                    placeholder="e.g. MagicMall" />
                </div>
                <div className="field">
                  <div className="label">Symbol / Initial</div>
                  <input className="input" value={logoSymbol} onChange={e=>setLogoSymbol(e.target.value)}
                    placeholder="e.g. M or MM" maxLength={5} />
                </div>
              </div>
            )}

            {logoMode === "existing" && (
              <div>
                <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.tgs,.json"
                  style={{ display:"none" }} onChange={handleLogoFile} />
                {!logoUrl ? (
                  <button className="btn btn-secondary btn-full" disabled={uploading}
                    onClick={() => logoInputRef.current?.click()}>
                    {uploading ? "Uploading…" : "Choose File (PNG / JPG / SVG / TGS / JSON)"}
                  </button>
                ) : (
                  <div className="row" style={{ gap:10 }}>
                    {["tgs","json"].includes(logoFileType) ? (
                      <AnimationPreview url={logoUrl} fileType={logoFileType} size="56px" autoplay loop />
                    ) : (
                      <img src={logoUrl} alt="logo" style={{ width:56, height:56, objectFit:"contain", borderRadius:8 }} />
                    )}
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{logoFile}</div>
                      <button className="btn btn-ghost" style={{ padding:"4px 0", fontSize:12 }}
                        onClick={() => logoInputRef.current?.click()}>
                        Change file
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Username ── */}
        <div className="card">
          <div className="row-between">
            <div>
              <div style={{ fontWeight:600 }}>Add Telegram Username</div>
              <div style={{ fontSize:12, color:"var(--hint)", marginTop:2 }}>Show @username on your emoji pack</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={addUsername}
                onChange={e => setAddUsername(e.target.checked)} />
              <div className="toggle-track" />
              <div className="toggle-thumb" />
            </label>
          </div>
          {addUsername && (
            <div style={{ marginTop:12 }}>
              <input className="input" value={tgUsername}
                onChange={e => setTgUsername(e.target.value)}
                placeholder="@yourusername" />
            </div>
          )}
        </div>

        {/* ── Global Colors ── */}
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:12 }}>Brand Colors</div>
          <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimary} />
          <div style={{ margin:"14px 0 0" }}>
            <ColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondary} />
          </div>
        </div>

        {/* ── Per-design customisation ── */}
        <div className="section-title">Your Selected Designs ({cart.length})</div>

        {cart.map((item) => (
          <div key={item.design.id} className="card">
            <div
              className="row-between"
              style={{ cursor:"pointer" }}
              onClick={() => setExpandedId(expandedId === item.design.id ? null : item.design.id)}
            >
              <div className="row" style={{ gap:10 }}>
                <div style={{ width:44, height:44, borderRadius:8, overflow:"hidden", background:"rgba(0,0,0,.2)", flexShrink:0 }}>
                  {item.design.file_url ? (
                    <AnimationPreview url={item.design.file_url} fileType={item.design.file_type}
                      size="44px" autoplay loop />
                  ) : (
                    <div style={{ width:44,height:44, display:"flex",alignItems:"center",justifyContent:"center", fontSize:20 }}>🎞</div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{item.design.name}</div>
                  <div style={{ fontSize:12, color:"var(--hint)" }}>{item.design.category_name || "—"}</div>
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--accent2)" }}>
                {expandedId === item.design.id ? "▲" : "▼"}
              </div>
            </div>

            {expandedId === item.design.id && (
              <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:12 }}>

                {/* Per-design color override */}
                <ColorPicker label="Primary Color Override"
                  value={item.primaryColor || primaryColor}
                  onChange={(v) => updateCartItem(item.design.id, { primaryColor: v })} />
                <ColorPicker label="Secondary Color Override"
                  value={item.secondaryColor || secondaryColor}
                  onChange={(v) => updateCartItem(item.design.id, { secondaryColor: v })} />

                {/* Extra colours */}
                <div>
                  <div className="label" style={{ marginBottom:8 }}>Extra Colors</div>
                  {(item.extraColors || []).map((ec, idx) => (
                    <div key={idx} className="row" style={{ marginBottom:8 }}>
                      <div className="color-swatch" style={{ background: ec.hex }} />
                      <input className="input" style={{ flex:1 }} value={ec.label}
                        placeholder="Label (e.g. Outline)"
                        onChange={(e) => {
                          const next = [...(item.extraColors||[])];
                          next[idx] = { ...ec, label: e.target.value };
                          updateCartItem(item.design.id, { extraColors: next });
                        }} />
                      <input type="color" value={ec.hex}
                        onChange={(e) => {
                          const next = [...(item.extraColors||[])];
                          next[idx] = { ...ec, hex: e.target.value };
                          updateCartItem(item.design.id, { extraColors: next });
                        }}
                        style={{ width:36, height:36, borderRadius:8, border:"none", background:"none", cursor:"pointer", padding:0 }} />
                      <button className="btn btn-ghost" style={{ padding:6 }}
                        onClick={() => {
                          const next = (item.extraColors||[]).filter((_,i)=>i!==idx);
                          updateCartItem(item.design.id, { extraColors: next });
                        }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-secondary" style={{ fontSize:13, padding:"8px 12px" }}
                    onClick={() => updateCartItem(item.design.id, {
                      extraColors: [...(item.extraColors||[]), { label:"", hex:"#888888" }]
                    })}>
                    <Plus size={14} /> Add Extra Color
                  </button>
                </div>

                {/* Custom text if design requires it */}
                {item.design.has_text && (
                  <div className="field">
                    <div className="label">Custom Text <span style={{ color:"var(--danger)" }}>*</span></div>
                    <input className="input" value={item.customText || ""}
                      onChange={(e) => updateCartItem(item.design.id, { customText: e.target.value })}
                      placeholder="Enter text for this design" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Total + proceed */}
        <div className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:12, color:"var(--hint)" }}>Total</div>
            <div style={{ fontSize:20, fontWeight:700 }}>{formatPrice(total)}</div>
          </div>
          <button
            className="btn btn-primary"
            disabled={!canProceed()}
            onClick={proceed}
            style={{ minWidth:120 }}
          >
            Continue →
          </button>
        </div>

      </div>
    </div>
  );
}
