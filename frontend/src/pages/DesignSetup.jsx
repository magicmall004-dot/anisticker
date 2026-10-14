import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, Plus, X, ChevronDown, ChevronUp, Film } from "lucide-react";
import { useApp } from "../context/AppContext";
import { uploadLogo, uploadDesignFile } from "../lib/api";
import { showBackButton, hideBackButton, haptic, showMainButton, hideMainButton } from "../lib/telegram";
import ColorPicker from "../components/ColorPicker";
import AnimationPreview from "../components/AnimationPreview";
import InstantPreview from "../components/InstantPreview";
import { formatPrice } from "../lib/utils";

export default function DesignSetup() {
  const { cart, updateCartItem, removeFromCart, user, cartTotal } = useApp();
  const navigate = useNavigate();

  // Global brand setup
  const [logoMode,    setLogoMode]    = useState("new");
  const [logoName,    setLogoName]    = useState("");
  const [logoSymbol,  setLogoSymbol]  = useState("");
  const [logoUrl,     setLogoUrl]     = useState("");
  const [logoFile,    setLogoFile]    = useState("");
  const [logoFileType,setLogoFileType]= useState("");
  const [addUsername, setAddUsername] = useState(false);
  const [tgUsername,  setTgUsername]  = useState(user?.username || "");
  const [primaryColor,   setPrimaryRaw]   = useState("#000000");
  const [secondaryColor, setSecondaryRaw] = useState("#ffffff");
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const logoInputRef = useRef();
  const allInstant = cart.every(i => i.design.is_instant);
  const total = cartTotal(user?.role);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    return hideBackButton;
  }, []);

  useEffect(() => {
    if (canProceed()) {
      showMainButton(`Proceed to Payment · ${formatPrice(total)}`, proceed);
    } else {
      hideMainButton();
    }
  }, [cart, logoMode, logoName, logoSymbol, logoUrl, addUsername, tgUsername, primaryColor, secondaryColor]);

  function setPrimary(color) {
    setPrimaryRaw(color);
    cart.forEach(item => {
      const slot = (item.design.color_map||[]).find(c=>c.role==="primary");
      const patch = { primaryColor: color };
      if (item.design.is_instant && slot) patch.instantColors = { ...(item.instantColors||{}), [slot.original]: color };
      updateCartItem(item.cartItemId, patch);
    });
  }

  function setSecondary(color) {
    setSecondaryRaw(color);
    cart.forEach(item => {
      const slot = (item.design.color_map||[]).find(c=>c.role==="secondary");
      const patch = { secondaryColor: color };
      if (item.design.is_instant && slot) patch.instantColors = { ...(item.instantColors||{}), [slot.original]: color };
      updateCartItem(item.cartItemId, patch);
    });
  }

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadLogo(file);
      setLogoUrl(res.url);
      setLogoFile(file.name);
      setLogoFileType(res.file_type || file.name.split('.').pop());
    } finally { setUploading(false); }
  }

  function canProceed() {
    if (!allInstant) {
      if (!logoMode) return false;
      if (logoMode === "new" && (!logoName.trim() || !logoSymbol.trim())) return false;
      if (logoMode === "existing" && !logoUrl) return false;
      if (addUsername && !tgUsername.trim()) return false;
    }
    return true;
  }

  function proceed() {
    haptic("medium");
    navigate("/payment", { state: {
      logoMode, logoName, logoSymbol, logoUrl,
      addUsername, tgUsername: tgUsername.replace('@',''),
      primaryColor, secondaryColor,
    }});
  }

  if (cart.length === 0) { navigate("/"); return null; }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22}/>
        </button>
        <div className="page-title">Design Setup</div>
        <button className="btn btn-ghost" style={{ padding:"6px 10px", fontSize:12, color:"var(--hint)" }}
          onClick={() => { /* share */ }}>
          <Upload size={16}/>
        </button>
      </div>

      <div className="page-body ds-auto">
        {/* Only show logo/brand setup for non-instant designs */}
        {!allInstant && (
          <>
            {/* Logo mode */}
            <div className="card">
              <div style={{ fontWeight:700, marginBottom:12 }}>Logo Setup</div>
              <div className="row ds-modes" style={{ gap:8, marginBottom:12 }}>
                {[["new","Create New"],["existing","Import Logo"]].map(([m,label]) => (
                  <button key={m} onClick={() => setLogoMode(m)}
                    className={`btn ${logoMode===m?"btn-primary":"btn-secondary"} btn-full`}
                    style={{ padding:"10px", fontSize:13 }}>
                    {label}
                  </button>
                ))}
              </div>

              {logoMode === "new" && (
                <div className="ds-fade" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div className="field">
                    <div className="label">Brand Name</div>
                    <input className="input" value={logoName} onChange={e=>setLogoName(e.target.value)} placeholder="e.g. MagicMall"/>
                  </div>
                  <div className="field">
                    <div className="label">Symbol / Initials</div>
                    <input className="input" value={logoSymbol} onChange={e=>setLogoSymbol(e.target.value)} placeholder="e.g. MM" maxLength={4}/>
                  </div>
                </div>
              )}

              {logoMode === "existing" && (
                <div>
                  <input ref={logoInputRef} type="file" accept="image/*,.tgs,.json" style={{ display:"none" }} onChange={handleLogoFile}/>
                  {!logoUrl ? (
                    <button className="btn btn-secondary btn-full" disabled={uploading} onClick={() => logoInputRef.current?.click()} style={{ padding:20, flexDirection:"column", gap:6 }}>
                      <Upload size={22} color="var(--accent)"/>
                      <span style={{ color:"var(--accent)", fontSize:13 }}>{uploading?"Uploading…":"Upload PNG / JPG / SVG / TGS"}</span>
                    </button>
                  ) : (
                    <div className="row" style={{ gap:10 }}>
                      {["tgs","json"].includes(logoFileType)
                        ? <AnimationPreview url={logoUrl} fileType={logoFileType} size="52px" autoplay loop/>
                        : <img src={logoUrl} alt="" style={{ width:52,height:52,objectFit:"contain",borderRadius:8,background:"var(--card)" }}/>}
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600,fontSize:13 }}>{logoFile}</div>
                        <button className="btn btn-ghost" style={{ padding:"4px 0",fontSize:12 }} onClick={() => logoInputRef.current?.click()}>Change file</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Username */}
            <div className="card">
              <div className="row-between">
                <div>
                  <div style={{ fontWeight:600 }}>Add Telegram Username</div>
                  <div style={{ fontSize:12, color:"var(--hint)" }}>Show @username on your emoji pack</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={addUsername} onChange={e=>setAddUsername(e.target.checked)}/>
                  <div className="toggle-track"/><div className="toggle-thumb"/>
                </label>
              </div>
              {addUsername && (
                <div style={{ marginTop:12 }}>
                  <input className="input" value={tgUsername} onChange={e=>setTgUsername(e.target.value)} placeholder="@yourusername"/>
                </div>
              )}
            </div>
          </>
        )}

        {/* Brand Colors — always show */}
        <div className="card">
          <div style={{ fontWeight:700, marginBottom:12 }}>Brand Colors</div>
          <div style={{ fontSize:12, color:"var(--hint)", marginBottom:12 }}>
            {allInstant ? "These colors will replace the design's color slots automatically." : "Applied to all designs. Override per-design below if needed."}
          </div>
          <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimary}/>
          <div style={{ marginTop:14 }}>
            <ColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondary}/>
          </div>
        </div>

        {/* Per-design */}
        <div className="section-title">Your Designs ({cart.length})</div>
        {cart.map((item) => {
          const isExpanded = expandedId === item.cartItemId;
          return (
            <div key={item.cartItemId} className="card" style={{ padding:0, overflow:"hidden" }}>
              {/* Header */}
              <div className="row-between" style={{ padding:"12px 14px", cursor:"pointer" }}
                onClick={() => { haptic("light"); setExpandedId(isExpanded ? null : item.cartItemId); }}>
                <div className="row" style={{ gap:10 }}>
                  <div style={{ width:42,height:42,borderRadius:8,overflow:"hidden",background:"rgba(0,0,0,.2)",flexShrink:0 }}>
                    {item.design.file_url
                      ? <AnimationPreview url={item.design.file_url} fileType={item.design.file_type} size="42px" autoplay loop/>
                      : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}><Film size={16}/></div>}
                  </div>
                  <div>
                    <div style={{ fontWeight:600,fontSize:14 }}>{item.design.name||item.design.category_name||"Design"}</div>
                    <div style={{ fontSize:12,color:"var(--hint)" }}>{formatPrice(item.design.user_price)}</div>
                  </div>
                </div>
                <div className="row" style={{ gap:8 }}>
                  <button onClick={e => { e.stopPropagation(); removeFromCart(item.cartItemId); }} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--danger)",padding:4 }}>
                    <X size={15}/>
                  </button>
                  {isExpanded ? <ChevronUp size={16} color="var(--hint)"/> : <ChevronDown size={16} color="var(--hint)"/>}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:12 }}>

                  {/* Live preview — reflects colors + logo/text as you customize */}
                  {item.design.is_instant && item.design.file_url?.endsWith(".tgs") && (
                    <InstantPreview
                      fileUrl={item.design.file_url}
                      colorMap={item.design.color_map || []}
                      instantColors={item.instantColors || {}}
                      logoMode={item.logoMode || "svg"}
                      instantSvg={item.instantSvg}
                      instantText={item.instantText}
                    />
                  )}

                  {/* Instant design color slots */}
                  {item.design.is_instant && item.design.type === "fixed" && (
                    <div style={{ fontSize:12, color:"var(--hint)" }}>This design uses fixed colors.</div>
                  )}
                  {item.design.is_instant && item.design.type !== "fixed" && (item.design.color_map||[]).length > 0 && (
                    <div>
                      <div className="label" style={{ margin:"10px 0 8px" }}>
                        {item.design.type === "adaptive" ? "Adaptive Color" : "Custom Colors"}
                      </div>
                      {(item.design.color_map||[]).map((slot,idx) => {
                        const roleLabels = { logo:"Logo Color", primary:"Primary Color", secondary:"Secondary Color" };
                        const label = roleLabels[slot.role] || (slot.role?.startsWith("extra") ? `Extra Color ${slot.role.replace("extra","")}` : slot.role);
                        const current = item.instantColors?.[slot.original] || (slot.role==="primary"?primaryColor:slot.role==="secondary"?secondaryColor:slot.original);
                        return (
                          <div key={idx} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:12,fontWeight:600,color:"var(--hint)",marginBottom:4 }}>{label}</div>
                            <div className="row" style={{ gap:8 }}>
                              <input type="color" value={current}
                                onChange={e => updateCartItem(item.cartItemId,{ instantColors:{ ...(item.instantColors||{}), [slot.original]:e.target.value } })}
                                style={{ width:42,height:38,borderRadius:8,border:"2px solid var(--border)",cursor:"pointer",padding:2,background:"transparent",flexShrink:0 }}/>
                              <input className="input" value={current} style={{ fontFamily:"monospace",fontSize:13 }}
                                onChange={e => updateCartItem(item.cartItemId,{ instantColors:{ ...(item.instantColors||{}), [slot.original]:e.target.value } })}/>
                              <div style={{ width:38,height:38,borderRadius:8,background:current,border:"2px solid var(--border)",flexShrink:0 }}/>
                            </div>
                            {item.design.type === "adaptive" && (
                              <div style={{ marginTop:8, padding:14, borderRadius:10, background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:current, border:"2px solid rgba(255,255,255,0.6)" }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SVG/text for logo slot */}
                  {item.design.is_instant && (item.design.color_map||[]).some(c=>c.role==="logo") && (
                    <div>
                      <div className="label" style={{ marginBottom:8 }}>Logo Replacement</div>
                      <div className="row" style={{ gap:6,marginBottom:8 }}>
                        {[["svg","Upload SVG"],["text","Custom Text"]].map(([m,label]) => (
                          <button key={m} onClick={() => updateCartItem(item.cartItemId, m === "svg" ? { logoMode:m, instantText:"" } : { logoMode:m, instantSvg:null, instantLogoUrl:null })}
                            className={`btn ${(item.logoMode||"svg")===m?"btn-primary":"btn-secondary"} btn-full`}
                            style={{ fontSize:12,padding:"8px" }}>{label}</button>
                        ))}
                      </div>
                      {(item.logoMode||"svg")==="svg" ? (
                        <div>
                          <input type="file" accept=".svg,image/svg+xml" style={{ display:"none" }}
                            id={`svg-${item.cartItemId}`}
                            onChange={async e => {
                              const file=e.target.files?.[0]; if(!file) return;
                              const txt=await file.text();
                              updateCartItem(item.cartItemId,{instantSvg:txt,instantLogoUrl:URL.createObjectURL(file)});
                            }}/>
                          <div className="row" style={{ gap:8 }}>
                            {item.instantLogoUrl && <img src={item.instantLogoUrl} alt="" style={{ width:40,height:40,borderRadius:8,objectFit:"contain",background:"var(--card)",flexShrink:0 }}/>}
                            <button className="btn btn-secondary btn-full" onClick={() => document.getElementById(`svg-${item.cartItemId}`).click()} style={{ fontSize:12,padding:"10px" }}>
                              <Upload size={13}/> {item.instantLogoUrl?"Change SVG":"Upload SVG Logo"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <input className="input" value={item.instantText||""} placeholder="Enter your brand name"
                          onChange={e => updateCartItem(item.cartItemId,{instantText:e.target.value})}/>
                      )}
                    </div>
                  )}

                  {/* Text slots */}
                  {item.design.has_text && (item.design.text_slots||[]).length > 0 && (
                    <div>
                      <div className="label" style={{ marginBottom:8 }}>Text Slots <span style={{ color:"var(--danger)" }}>*</span></div>
                      {(item.design.text_slots||[]).map((slot,idx) => {
                        const val=(item.textValues||[]).find(v=>v.name===slot.name)?.value||"";
                        return (
                          <div key={idx} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:12,color:"var(--hint)",marginBottom:4 }}>{slot.name}</div>
                            <input className="input" placeholder={slot.placeholder||`Enter ${slot.name}`} value={val}
                              onChange={e => {
                                const newVals=[...(item.textValues||[])].filter(v=>v.name!==slot.name);
                                newVals.push({name:slot.name,value:e.target.value});
                                updateCartItem(item.cartItemId,{textValues:newVals});
                              }}/>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Per-design color override (non-instant only) */}
                  {!item.design.is_instant && item.design.type === "fixed" && (
                    <div style={{ fontSize:12, color:"var(--hint)" }}>This design uses fixed colors.</div>
                  )}
                  {!item.design.is_instant && item.design.type !== "fixed" && (
                    <div>
                      <div className="label" style={{ marginBottom:8 }}>
                        {item.design.type === "adaptive" ? "Adaptive Color (optional)" : "Color Override (optional)"}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns: item.design.type === "adaptive" ? "1fr" : "1fr 1fr", gap:8 }}>
                        <div>
                          <div style={{ fontSize:11,color:"var(--hint)",marginBottom:4 }}>
                            {item.design.type === "adaptive" ? "Color" : "Primary"}
                          </div>
                          <div className="row" style={{ gap:6 }}>
                            <input type="color" value={item.primaryColor||primaryColor}
                              onChange={e=>updateCartItem(item.cartItemId,{primaryColor:e.target.value})}
                              style={{ width:36,height:34,borderRadius:6,border:"1.5px solid var(--border)",cursor:"pointer",padding:2,background:"transparent" }}/>
                            <input className="input" value={item.primaryColor||primaryColor} style={{ fontFamily:"monospace",fontSize:11 }}
                              onChange={e=>updateCartItem(item.cartItemId,{primaryColor:e.target.value})}/>
                          </div>
                        </div>
                        {item.design.type !== "adaptive" && (
                        <div>
                          <div style={{ fontSize:11,color:"var(--hint)",marginBottom:4 }}>Secondary</div>
                          <div className="row" style={{ gap:6 }}>
                            <input type="color" value={item.secondaryColor||secondaryColor}
                              onChange={e=>updateCartItem(item.cartItemId,{secondaryColor:e.target.value})}
                              style={{ width:36,height:34,borderRadius:6,border:"1.5px solid var(--border)",cursor:"pointer",padding:2,background:"transparent" }}/>
                            <input className="input" value={item.secondaryColor||secondaryColor} style={{ fontFamily:"monospace",fontSize:11 }}
                              onChange={e=>updateCartItem(item.cartItemId,{secondaryColor:e.target.value})}/>
                          </div>
                        </div>
                        )}
                      </div>
                      {(item.design.extra_colors||[]).length > 0 && (
                        <div style={{ marginTop:10 }}>
                          {(item.design.extra_colors||[]).map((defaultHex, idx) => {
                            const current = (item.extraColors||[])[idx] || defaultHex;
                            return (
                              <div key={idx} style={{ marginBottom:8 }}>
                                <div style={{ fontSize:11,color:"var(--hint)",marginBottom:4 }}>Extra Color {idx+1}</div>
                                <div className="row" style={{ gap:6 }}>
                                  <input type="color" value={current}
                                    onChange={e => {
                                      const arr=[...(item.extraColors||item.design.extra_colors)]; arr[idx]=e.target.value;
                                      updateCartItem(item.cartItemId,{extraColors:arr});
                                    }}
                                    style={{ width:36,height:34,borderRadius:6,border:"1.5px solid var(--border)",cursor:"pointer",padding:2,background:"transparent" }}/>
                                  <input className="input" value={current} style={{ fontFamily:"monospace",fontSize:11 }}
                                    onChange={e => {
                                      const arr=[...(item.extraColors||item.design.extra_colors)]; arr[idx]=e.target.value;
                                      updateCartItem(item.cartItemId,{extraColors:arr});
                                    }}/>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Proceed button fallback */}
        {!window.Telegram?.WebApp && (
          <button className="btn btn-primary btn-full" disabled={!canProceed()} onClick={proceed} style={{ padding:16 }}>
            Proceed to Payment · {formatPrice(total)}
          </button>
        )}

        <div style={{ height:20 }}/>
      </div>
    </div>
  );
}
