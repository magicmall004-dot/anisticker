import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Wallet, Clock, CheckCircle, Settings, ChevronRight, Home, Trophy, Gift, Zap, X, Crown, Star, Medal, Award, Gem } from "lucide-react";
import { getOrders, getMyBalance, getMyEmojiStatus } from "../lib/api";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, addToHomeScreen, haptic } from "../lib/telegram";
import { useEmojis } from "../context/EmojiContext";
import { useGraphics, GRAPHICS_LEVELS } from "../context/GraphicsContext";
import AnimationPreview from "../components/AnimationPreview";
import AnimatedNumber from "../components/AnimatedNumber";

const GRAPHICS_LABELS = { low: "Low", balanced: "Balanced", high: "High", ultra: "Ultra" };
const GRAPHICS_DESCRIPTIONS = {
  low:      "Minimal effects — best performance on older devices.",
  balanced: "Light effects — a balance of style and speed.",
  high:     "Most effects enabled — smooth on most phones.",
  ultra:    "All effects and motion enabled — best on newer devices.",
};

export default function Profile() {
  const { user } = useApp();
  const navigate = useNavigate();
  const emojis = useEmojis();
  const { level: graphicsLevel, setLevel: setGraphicsLevel } = useGraphics();
  const [stats,   setStats]   = useState({ total:0, pending:0, done:0, spent:0 });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [emojiStatusUrl, setEmojiStatusUrl] = useState(null);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    getOrders().then((orders) => {
      const total   = orders.length;
      const pending = orders.filter(o => o.status==="pending"||o.status==="accepted").length;
      const done    = orders.filter(o => o.status==="done").length;
      const spent   = orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total_price||0),0);
      setStats({ total, pending, done, spent });
    }).finally(() => setLoading(false));
    getMyBalance().then((b) => setBalance(b.balance)).catch(() => {});
    getMyEmojiStatus().then((r) => setEmojiStatusUrl(r.emoji_status_url)).catch(() => {});
    return hideBackButton;
  }, []);

  const roleColor = { owner:"#f59e0b", reseller:"var(--accent)", user:"var(--hint)" };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">Profile</div>
      </div>

      <div className="page-body pf-auto">
        <div className="card-glow" style={{ textAlign:"center", padding:"24px 16px" }}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" style={{ width:72,height:72,borderRadius:"50%",objectFit:"cover",margin:"0 auto 12px",border:"2px solid rgba(4,217,255,0.4)" }} />
          ) : (
            <div style={{ width:72,height:72,borderRadius:"50%",margin:"0 auto 12px",background:"rgba(4,217,255,0.1)",border:"2px solid rgba(4,217,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800 }} className="glow-text">
              {(user?.first_name||"?")[0]}
            </div>
          )}
          <div style={{ fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <span>{user?.first_name} {user?.last_name}</span>
            {emojiStatusUrl && (
              emojiStatusUrl.endsWith(".tgs")
                ? <AnimationPreview url={emojiStatusUrl} fileType="tgs" size="20px" autoplay loop />
                : <img src={emojiStatusUrl} alt="" style={{ width:20, height:20 }} />
            )}
          </div>
          {user?.username && <div style={{ fontSize:13, color:"var(--hint)", marginTop:2 }}>@{user.username}</div>}
          <div style={{ display:"inline-flex",alignItems:"center",gap:4,marginTop:10,padding:"4px 14px",borderRadius:99,background:(roleColor[user?.role]||"var(--hint)")+"1a",color:roleColor[user?.role]||"var(--hint)",fontSize:12,fontWeight:700,textTransform:"capitalize" }}>
            {user?.role === "owner" && (emojis.tgs_owner_badge ? <AnimationPreview url={emojis.tgs_owner_badge} fileType={emojis.tgs_owner_badge.endsWith("tgs")?"tgs":"json"} size="18px" autoplay loop /> : <Crown size={16}/>)}
            {user?.role === "reseller" && (emojis.tgs_reseller_badge ? <AnimationPreview url={emojis.tgs_reseller_badge} fileType={emojis.tgs_reseller_badge.endsWith("tgs")?"tgs":"json"} size="18px" autoplay loop /> : <Star size={16}/>)}
            {user?.role}
          </div>
        </div>

        <div className="card-glow" onClick={() => navigate("/wallet")} style={{ cursor:"pointer" }}>
          <div className="row-between">
            <div className="row" style={{ gap:10 }}>
              <Wallet size={22} color="var(--accent)" />
              <div>
                <div style={{ fontSize:11, color:"var(--hint)" }}>Wallet Balance</div>
                <div style={{ fontSize:18, fontWeight:800 }} className="glow-text">
                  <AnimatedNumber value={balance} format={formatPrice} />
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--hint)" />
          </div>
        </div>

        {(() => {
          const spent = Number(user?.lifetime_spent || 0);
          const tiers = [
            { name: "Bronze", min: 0, pct: 0, tgs: emojis.tgs_tier_bronze, fallback: <Medal size={16}/> },
            { name: "Silver", min: 100000, pct: 2, tgs: emojis.tgs_tier_silver, fallback: <Award size={16}/> },
            { name: "Gold", min: 300000, pct: 4, tgs: emojis.tgs_tier_gold, fallback: <Trophy size={16}/> },
            { name: "Platinum", min: 600000, pct: 6, tgs: emojis.tgs_tier_platinum, fallback: <Gem size={16}/> },
          ];
          let current = tiers[0];
          let next = tiers[1];
          for (let i = 0; i < tiers.length; i++) {
            if (spent >= tiers[i].min) { current = tiers[i]; next = tiers[i + 1] || null; }
          }
          const progress = next ? Math.min(100, ((spent - current.min) / (next.min - current.min)) * 100) : 100;
          return (
            <>
              <div className="card" style={{ padding:14, marginBottom:14, cursor:"pointer" }} onClick={() => setTierModalOpen(true)}>
                <div className="row-between" style={{ marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:800, display:"flex", alignItems:"center", gap:6 }}>
                    {current.tgs
                      ? <AnimationPreview url={current.tgs} fileType={current.tgs.endsWith("tgs")?"tgs":"json"} size="20px" autoplay loop/>
                      : <span>{current.fallback}</span>}
                    {current.name} Tier{current.pct > 0 ? ` \u2014 ${current.pct}% off` : ""}
                  </div>
                  <div style={{ fontSize:11, color:"var(--hint)" }}>{formatPrice(spent)} spent</div>
                </div>
                <div style={{ height:6, borderRadius:99, background:"var(--bg)", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${progress}%`, borderRadius:99 }} className="pf-bar" />
                </div>
                {next && (
                  <div style={{ fontSize:11, color:"var(--hint)", marginTop:6 }}>
                    {formatPrice(next.min - spent)} more to {next.name} ({next.pct}% off)
                  </div>
                )}
                <div style={{ fontSize:10, color:"var(--accent)", marginTop:8, fontWeight:600 }}>Tap to view all tiers →</div>
              </div>

              {tierModalOpen && createPortal(
                <div className="overlay" onClick={() => setTierModalOpen(false)} style={{ zIndex:500 }}>
                  <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight:"calc(75vh - 90px)", overflowY:"auto", marginBottom:90 }}>
                    <div className="row-between" style={{ marginBottom:14 }}>
                      <div style={{ fontWeight:800, fontSize:16 }}>Loyalty Tiers</div>
                      <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => setTierModalOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {tiers.map((t, ti) => {
                        const isCurrent = t.name === current.name;
                        const unlocked = spent >= t.min;
                        return (
                          <div key={t.name} style={{
                            display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12,
                            background: isCurrent ? "rgba(4,217,255,0.1)" : "var(--bg)",
                            border: isCurrent ? "1px solid var(--accent)" : "1px solid var(--border)",
                            opacity: unlocked ? 1 : 0.55,
                          }}>
                            <div style={{ width:36, height:36, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {t.tgs
                                ? <AnimationPreview url={t.tgs} fileType={t.tgs.endsWith("tgs")?"tgs":"json"} size="36px" autoplay loop/>
                                : <span style={{ fontSize:26 }}>{t.fallback}</span>}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:6 }}>
                                {t.name}
                                {isCurrent && <span style={{ fontSize:9, fontWeight:700, color:"var(--accent)", background:"rgba(4,217,255,0.15)", padding:"2px 6px", borderRadius:99 }}>CURRENT</span>}
                              </div>
                              <div style={{ fontSize:11, color:"var(--hint)", marginTop:2 }}>
                                {t.min === 0 ? "Starting tier" : `${formatPrice(t.min)}+ lifetime spend`}
                              </div>
                            </div>
                            <div style={{ fontWeight:800, fontSize:15, color: t.pct > 0 ? "var(--price)" : "var(--hint)" }}>
                              {t.pct > 0 ? `${t.pct}%` : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </>
          );
        })()}
        <div className="card" style={{ padding:14, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>Theme</div>
          <div style={{ fontSize:11, color:"var(--hint)", marginBottom:12 }}>Choose a color palette for your app</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              { name:"Cyan Nova",    accent:"#04D9FF", price:"#FFC93C", pink:"#FF3D8A" },
              { name:"Sunset",       accent:"#FF6B4A", price:"#FFD166", pink:"#EF476F" },
              { name:"Emerald",      accent:"#22C55E", price:"#FBBF24", pink:"#06B6D4" },
              { name:"Violet Dream", accent:"#A78BFA", price:"#FBBF24", pink:"#F472B6" },
              { name:"Rose Gold",    accent:"#F472B6", price:"#FCD34D", pink:"#FB7185" },
              { name:"Midnight",     accent:"#60A5FA", price:"#FDE68A", pink:"#38BDF8" },
            ].map(t => (
              <div key={t.name} onClick={() => {
                document.documentElement.style.setProperty("--accent", t.accent);
                document.documentElement.style.setProperty("--price", t.price);
                document.documentElement.style.setProperty("--pink", t.pink);
                localStorage.setItem("ani_theme", JSON.stringify(t));
              }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:10, background:"var(--bg)", border:"1px solid var(--border)", cursor:"pointer" }}>
                <div style={{ display:"flex" }}>
                  <div style={{ width:14,height:14,borderRadius:"50%",background:t.accent,marginLeft:-4,border:"1.5px solid var(--card)" }}/>
                  <div style={{ width:14,height:14,borderRadius:"50%",background:t.price,marginLeft:-4,border:"1.5px solid var(--card)" }}/>
                  <div style={{ width:14,height:14,borderRadius:"50%",background:t.pink,marginLeft:-4,border:"1.5px solid var(--card)" }}/>
                </div>
                <div style={{ fontSize:12, fontWeight:600 }}>{t.name}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-full" style={{ fontSize:12 }}
            onClick={() => {
              document.documentElement.style.removeProperty("--accent");
              document.documentElement.style.removeProperty("--price");
              document.documentElement.style.removeProperty("--pink");
              localStorage.removeItem("ani_theme");
            }}>
            Reset to Default
          </button>
        </div>
        <div className="section-title">Order Stats</div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:24 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div className="card" style={{ textAlign:"center", padding:"16px 10px" }}>
              <Package size={20} color="var(--accent)" style={{ marginBottom:6 }} />
              <div style={{ fontSize:20, fontWeight:800 }}>{stats.total}</div>
              <div style={{ fontSize:11, color:"var(--hint)" }}>Total Orders</div>
            </div>
            <div className="card" style={{ textAlign:"center", padding:"16px 10px" }}>
              <Clock size={20} color="var(--warning)" style={{ marginBottom:6 }} />
              <div style={{ fontSize:20, fontWeight:800 }}>{stats.pending}</div>
              <div style={{ fontSize:11, color:"var(--hint)" }}>In Progress</div>
            </div>
            <div className="card" style={{ textAlign:"center", padding:"16px 10px" }}>
              <CheckCircle size={20} color="var(--success)" style={{ marginBottom:6 }} />
              <div style={{ fontSize:20, fontWeight:800 }}>{stats.done}</div>
              <div style={{ fontSize:11, color:"var(--hint)" }}>Completed</div>
            </div>
            <div className="card" style={{ textAlign:"center", padding:"16px 10px" }}>
              <Wallet size={20} color="var(--accent)" style={{ marginBottom:6 }} />
              <div style={{ fontSize:16, fontWeight:800 }}>{formatPrice(stats.spent)}</div>
              <div style={{ fontSize:11, color:"var(--hint)" }}>Total Spent</div>
            </div>
          </div>
        )}

        <div className="section-title">Graphics Quality</div>
        <div className="card" style={{ padding:14 }}>
          <div className="row" style={{ gap:8, marginBottom:10 }}>
            <Zap size={16} color="var(--accent)" />
            <span style={{ fontSize:13, fontWeight:700 }}>Effects &amp; Animation</span>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {GRAPHICS_LEVELS.map((lvl) => (
              <div
                key={lvl}
                className={`pill-v2 ${graphicsLevel===lvl?"active":""}`}
                style={{ flex:"1 1 auto", textAlign:"center", justifyContent:"center" }}
                onClick={() => { haptic("light"); setGraphicsLevel(lvl); }}
              >
                {GRAPHICS_LABELS[lvl]}
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:"var(--hint)", marginTop:10 }}>
            {GRAPHICS_DESCRIPTIONS[graphicsLevel]}
          </div>
        </div>

        <div className="section-title">Quick Links</div>
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <NavRow icon={Trophy} label="Leaderboard" onClick={() => navigate("/leaderboard")} />
          <NavRow icon={Gift} label="Past Giveaways" onClick={() => navigate("/giveaways")} border />
          {user?.role === "owner" && <NavRow icon={Settings} label="Owner Panel" onClick={() => navigate("/owner")} border />}
          <NavRow icon={Home} label="Add to Home Screen" onClick={addToHomeScreen} border />
        </div>
        <div style={{ textAlign:"center", fontSize:11, color:"var(--hint)", marginTop:8 }}>MagicMall Animated Emoji Studio</div>
      </div>
    </div>
  );
}

function NavRow({ icon: Icon, label, onClick, border }) {
  return (
    <div className="row-between" onClick={onClick} style={{ padding:"14px 16px", cursor:"pointer", borderTop: border ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
      <div className="row" style={{ gap:10 }}>
        <Icon size={18} color="var(--accent)" />
        <span style={{ fontWeight:600, fontSize:14 }}>{label}</span>
      </div>
      <ChevronLeft size={16} color="var(--hint)" style={{ transform:"rotate(180deg)" }} />
    </div>
  );
}
