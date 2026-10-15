import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Settings, ShoppingBag, Check, Maximize2, RefreshCw, Send, Search, X, ArrowUpDown, Tag, LayoutGrid, Heart, Flame, PartyPopper, Film } from "lucide-react";
import { getDesigns, getCategories, getOrders, getAppSettings, getMyVouchers, getFavorites, addFavorite, removeFavorite } from "../lib/api";
import { useApp } from "../context/AppContext";
import { haptic, openTelegramLink } from "../lib/telegram";
import AnimationPreview from "../components/AnimationPreview";
import FullscreenPreview from "../components/FullscreenPreview";
import CartBar from "../components/CartBar";
import GiveawayBanner from "../components/GiveawayBanner";
import Loader from "../components/Loader";
import AnimatedNumber from "../components/AnimatedNumber";
import PriceTag from "../components/PriceTag";
import { useEmojis } from "../context/EmojiContext";
import { useGraphics } from "../context/GraphicsContext";
import { formatPrice } from "../lib/utils";

const LOGO_URL = "https://njnvplfaevaudhcjayyz.supabase.co/storage/v1/object/public/designs/logo.json";
const PULL_THRESHOLD = 70;
const SORT_OPTIONS = [
  { key: "newest",     label: "Newest" },
  { key: "price_low",  label: "Price ↑" },
  { key: "price_high", label: "Price ↓" },
];

// Badge priority: first match wins. Add new badge types here instead of
// growing an ad-hoc conditional chain in the render.
function getBadge(design, { isFree, isNew }) {
  if (isFree) return "free";
  if (isNew) return "new";
  return null;
}

const TYPE_STYLES = {
  regular:  { label: "Regular",  color: "#9ca3af", bg: "rgba(156,163,175,0.14)", border: "rgba(156,163,175,0.35)" },
  adaptive: { label: "Adaptive", color: "#a78bfa", bg: "rgba(167,139,250,0.16)", border: "rgba(167,139,250,0.45)" },
  fixed:    { label: "Fixed",    color: "#fbbf24", bg: "rgba(251,191,36,0.14)",  border: "rgba(251,191,36,0.45)" },
};

function TypeBadge({ type }) {
  const t = TYPE_STYLES[type] || TYPE_STYLES.regular;
  return (
    <span style={{ fontSize:8, fontWeight:800, letterSpacing:".04em", textTransform:"uppercase", padding:"1px 5px", borderRadius:4, color:t.color, background:t.bg, border:`1px solid ${t.border}` }}>
      {t.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="design-card skeleton-card">
      <div className="design-card-anim skeleton-shimmer" />
      <div className="design-card-info">
        <div className="skeleton-line skeleton-shimmer" style={{ width: "60%", height: 10, marginBottom: 6 }} />
        <div className="skeleton-line skeleton-shimmer" style={{ width: "40%", height: 14 }} />
      </div>
    </div>
  );
}

// Only mounts (fetches + decompresses + renders) the actual animation once
// the card scrolls near the viewport, instead of every card loading at once
// on initial render. Stays mounted once shown, so scrolling away and back
// doesn't re-fetch.
function LazyAnimationPreview(props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" } // start loading a bit before it's actually on screen
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {visible
        ? <AnimationPreview {...props} />
        : <div className="skeleton-shimmer" style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />}
    </div>
  );
}

export default function DesignList() {
  const { user, addToCart, removeFromCart, isInCart, cart, countInCart } = useApp();
  const navigate = useNavigate();
  const emojis = useEmojis();
  const { effects } = useGraphics();
  const [searchParams] = useSearchParams();
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const [designs,    setDesigns]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat,  setActiveCat]  = useState(null);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [playIds,    setPlayIds]    = useState(new Set());
  const [favIds,     setFavIds]      = useState(new Set());
  const [previewDesign, setPreviewDesign] = useState(null);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [channelUrl,    setChannelUrl]    = useState("");
  const [refreshing,    setRefreshing]    = useState(false);
  const [search,        setSearch]        = useState("");

  useEffect(() => {
    getFavorites().then((ids) => setFavIds(new Set(ids))).catch(() => {});
  }, []);

  function toggleFavorite(e, designId) {
    e.stopPropagation();
    haptic("light");
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(designId)) { next.delete(designId); removeFavorite(designId).catch(() => {}); }
      else { next.add(designId); addFavorite(designId).catch(() => {}); }
      return next;
    });
  }
  const [activeTag,     setActiveTag]     = useState(null);
  const [tagsOpen,      setTagsOpen]      = useState(false);
  const [voucherDesignIds, setVoucherDesignIds] = useState(new Set());
  const [glowId, setGlowId] = useState(null);
  const [bannerBalance, setBannerBalance] = useState(0);
  const [cartVisible, setCartVisible] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "price_low" | "price_high"
  const [gridCols, setGridCols] = useState(() => {
    try { return localStorage.getItem("designGridCols") === "2" ? 2 : 3; } catch (e) { return 3; }
  });
  const [recentIds, setRecentIds] = useState([]);
  const logoRef = useRef(null);
  const scrollRef = useRef(null);
  const touchStartY = useRef(null);
  const pulling = useRef(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentlyViewedDesigns") || "[]");
      if (Array.isArray(stored)) setRecentIds(stored);
    } catch (e) { /* ignore corrupt storage */ }
    loadData();
    getAppSettings().then((s) => setChannelUrl(s.channel_url || "")).catch(() => {});
    getMyVouchers().then((vs) => setVoucherDesignIds(new Set(vs.map(v => v.design_id)))).catch(() => {});
    import("../lib/api").then(m => m.getMyBalance().then(b => setBannerBalance(b.balance)).catch(()=>{}));
  }, []);

  useEffect(() => {
    if (user?.role === "owner") {
      getOrders({ status:"pending" }).then((o) => setPendingCount(o.length)).catch(() => {});
    }
  }, [user]);

  // A "View in App" link (e.g. from the bot after sending a custom emoji)
  // opens the app with ?design=<id> — auto-open that design's preview once.
  useEffect(() => {
    if (deepLinkHandled || designs.length === 0) return;
    const targetId = searchParams.get("design");
    if (targetId) {
      const found = designs.find((d) => d.id === targetId);
      if (found) setPreviewDesign(found);
    }
    setDeepLinkHandled(true);
  }, [designs, searchParams, deepLinkHandled]);

  useEffect(() => {
    if (cart.length > 0 && !cartVisible) setCartVisible(true);
    if (cart.length === 0 && cartVisible) {
      setTimeout(() => setCartVisible(false), 350);
    }
  }, [cart.length]);

  useEffect(() => {
    const intensity = effects.parallaxIntensity;
    if (!intensity) {
      // Parallax disabled at this tier — reset any leftover transform and skip the listener entirely.
      if (logoRef.current) {
        logoRef.current.style.transform = "";
        logoRef.current.style.opacity = "";
      }
      return;
    }
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (logoRef.current) {
        const offset = Math.min(y * 0.4, 30) * intensity;
        logoRef.current.style.transform = `translateY(${offset}px) scale(${Math.max(0.7, 1 - y * 0.002 * intensity)})`;
        logoRef.current.style.opacity = Math.max(0.3, 1 - y * 0.004 * intensity);
      }
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [effects.parallaxIntensity]);

  function recordRecentlyViewed(designId) {
    setRecentIds((prev) => {
      const next = [designId, ...prev.filter((id) => id !== designId)].slice(0, 10);
      try { localStorage.setItem("recentlyViewedDesigns", JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  }

  async function loadData() {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([getDesigns(), getCategories()]);
      setDesigns(d);
      setCategories(c);
    } finally { setLoading(false); }
  }

  async function handleRefresh() {
    haptic("light");
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 400);
  }

  // Pull-to-refresh: only engages when the scroll container is already at the top,
  // so it doesn't fight normal scrolling.
  function onTouchStart(e) {
    if (!effects.pullToRefresh) return;
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }
  function onTouchMove(e) {
    if (!effects.pullToRefresh || !pulling.current || touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      setPullDist(Math.min(dy * 0.5, 90));
    }
  }
  function onTouchEnd() {
    if (!effects.pullToRefresh) return;
    if (pulling.current && pullDist > PULL_THRESHOLD && !refreshing) {
      handleRefresh();
    }
    pulling.current = false;
    touchStartY.current = null;
    setPullDist(0);
  }

  function cycleSort() {
    haptic("light");
    const idx = SORT_OPTIONS.findIndex((o) => o.key === sortBy);
    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key);
  }

  function toggleGridCols() {
    haptic("light");
    setGridCols((prev) => {
      const next = prev === 3 ? 2 : 3;
      try { localStorage.setItem("designGridCols", String(next)); } catch (e) { /* ignore */ }
      return next;
    });
  }

  const filtered = designs.filter((d) => {
    if (activeCat && d.category_id !== activeCat) return false;
    if (activeTag && !(d.tags || []).includes(activeTag)) return false;
    if (showFavOnly && !favIds.has(d.id)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (d.name || "").toLowerCase().includes(s) || (d.tags || []).some(t => t.toLowerCase().includes(s));
    }
    return true;
  });

  const allTags = [...new Set(designs.flatMap(d => d.tags || []))].filter(Boolean);

  const price = (d) => user?.role === "reseller" ? d.reseller_price : d.user_price;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_low") return price(a) - price(b);
    if (sortBy === "price_high") return price(b) - price(a);
    // newest — fall back to insertion order if created_at missing
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const recentDesigns = recentIds
    .map((id) => designs.find((d) => d.id === id))
    .filter(Boolean);
  const getDiscount = (d) => {
    const cat = categories.find(c => c.id === d.category_id);
    return cat?.discount_amount || 0;
  };

  function toggleDesign(design) {
    haptic("light");
    setGlowId(design.id);
    setTimeout(() => setGlowId(null), 400);
    try {
      if (isInCart(design.id)) {
        cart.filter(i => i.design.id === design.id).forEach(i => removeFromCart(i.cartItemId));
        setPlayIds((prev) => { const s = new Set(prev); s.delete(design.id); return s; });
      } else {
        addToCart(design);
        // Play animation once then stop
        setPlayIds((prev) => new Set([...prev, design.id]));
        setTimeout(() => {
          setPlayIds((prev) => { const s = new Set(prev); s.delete(design.id); return s; });
        }, 3000);
      }
    } catch (err) {
      haptic("error");
      console.error("Cart update failed:", err);
    }
  }

  const isOwner = user?.role === "owner";
  const hasActiveFilter = Boolean(search || activeCat || activeTag);
  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label || "Sort";
  const gridStyle = { gridTemplateColumns: `repeat(${gridCols}, 1fr)` };

  function squareBtnStyle(active) {
    return {
      display:"flex", alignItems:"center", justifyContent:"center", gap:2, flexShrink:0,
      background: active ? "rgba(var(--accent-rgb),0.12)" : "rgba(255,255,255,0.05)",
      border: active ? "1px solid rgba(var(--accent-rgb),0.3)" : "1px solid rgba(255,255,255,0.1)",
      borderRadius:"var(--radius-sm)", padding:"10px 11px",
      color: active ? "var(--accent)" : "var(--hint)",
      cursor:"pointer",
    };
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", overflow:"hidden" }}>
      {/* Header */}
      <div className="page-header-premium">
        <div className="header-logo parallax-header-logo" ref={logoRef}>
          <AnimationPreview url={LOGO_URL} fileType="json" size="28px" autoplay loop />
        </div>
        <div className="header-brand" style={{ display:"flex",alignItems:"center",gap:8,flex:1 }}>
          <div style={{ width: "100%", height: 32 }}>
            <AnimationPreview
              url="https://raw.githubusercontent.com/magicmall004-dot/anisticker/main/LOGO_TEXT.json"
              fileType="json"
              size="100%"
              autoplay
              loop
              fit="meet"
            />
          </div>
        </div>
        {channelUrl && (
          <button className="btn btn-ghost" style={{ padding:7 }} onClick={() => openTelegramLink(channelUrl)}>
            <Send size={17} />
          </button>
        )}
        <button className="btn btn-ghost" style={{ padding:7 }} onClick={handleRefresh}>
          {refreshing ? <Loader size={17} /> : <RefreshCw size={17} />}
        </button>
        {isOwner && (
          <button className="btn btn-ghost" style={{ padding:7, position:"relative" }} onClick={() => navigate("/owner")}>
            <Settings size={18} />
            {pendingCount > 0 && (
              <span style={{ position:"absolute",top:2,right:2,background:"var(--danger)",color:"#fff",fontSize:9,fontWeight:700,borderRadius:99,minWidth:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px" }}>
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* User banner */}
      {user && (
        <div style={{ padding:"8px 16px 0" }}>
          <div className="user-banner-v2">
            <div className="avatar-ring">
              {user.photo_url
                ? <img src={user.photo_url} alt="" />
                : <div className="avatar-placeholder">{(user.first_name||"?")[0]}</div>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>
                Hi, <span className="glow-text">{user.first_name}</span> 👋
              </div>
              {user.role !== "user" && (
                <div style={{ fontSize:10,color:"var(--accent)",marginTop:1,fontWeight:600,textTransform:"capitalize" }}>
                  {user.role==="owner" ? "👑 Owner" : "⭐ Reseller"}
                </div>
              )}
            </div>
            <div className="balance-pill">
              <div style={{ fontSize:9,color:"var(--hint)",letterSpacing:".05em",textTransform:"uppercase" }}>Balance</div>
              <div style={{ fontSize:13,fontWeight:800,color:"var(--accent)" }}><AnimatedNumber value={bannerBalance} format={formatPrice}/></div>
            </div>
          </div>
        </div>
      )}

      {/* Giveaway banner */}
      <div style={{ paddingTop:8 }}>
        <GiveawayBanner />
      </div>

      {/* Search bar + Tags + Sort + grid-density toggle + clear-filters chip — one row */}
      <div style={{ padding:"8px 16px 0", display:"flex", alignItems:"center", gap:8 }}>
        <div className="search-box" style={{ flex:1, minWidth:0, display:"flex",alignItems:"center",gap:8,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"8px 12px" }}>
          <Search size={16} color="var(--hint)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search designs or tags…"
            style={{ flex:1,minWidth:0,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"var(--font)" }} />
          {search && <button onClick={() => setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}><X size={14} color="var(--hint)"/></button>}
        </div>
        {allTags.length > 0 && (
          <button className="icon-btn-press" onClick={() => { haptic("light"); setTagsOpen(!tagsOpen); }} title="Tags" style={squareBtnStyle(tagsOpen || !!activeTag)}>
            <Tag size={14} />
          </button>
        )}
        <button className="icon-btn-press" onClick={cycleSort} title={`Sort: ${currentSortLabel}`} style={squareBtnStyle(false)}>
          <ArrowUpDown size={14} />
        </button>
        <button className="icon-btn-press" onClick={toggleGridCols} title={`Show ${gridCols === 3 ? 2 : 3} per row`} style={squareBtnStyle(false)}>
          <LayoutGrid size={14} />
          <span style={{ fontSize:9, fontWeight:800 }}>{gridCols}</span>
        </button>
        {hasActiveFilter && (
          <button
            className="icon-btn-press"
            onClick={() => { haptic("light"); setSearch(""); setActiveCat(null); setActiveTag(null); }}
            style={{
              display:"flex", alignItems:"center", gap:4, flexShrink:0,
              background:"var(--card)", border:"1px solid var(--border)",
              borderRadius:999, padding:"10px 11px", fontSize:11, fontWeight:600,
              color:"var(--hint)", cursor:"pointer",
            }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div style={{ padding:"8px 16px 0" }}>
          <div className="scroll-row">
            <div className={`pill-v2 ${!activeCat?"active":""}`} onClick={() => { haptic("light"); setActiveCat(null); }}>All</div>
            <div className={`pill-v2 ${showFavOnly?"active":""}`} onClick={() => { haptic("light"); setShowFavOnly(!showFavOnly); }}><Heart size={12} style={{display:"inline",verticalAlign:"-2px"}}/> Favorites</div>
            {categories.map((c) => (
              <div key={c.id} className={`pill-v2 ${activeCat===c.id?"active":""}`}
                onClick={() => { haptic("light"); setActiveCat(c.id===activeCat?null:c.id); }}>
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag filter — collapsed by default, toggled open via the Tags pill above */}
      {allTags.length > 0 && tagsOpen && (
        <div style={{ padding:"6px 16px 0" }}>
          <div className="scroll-row">
            {allTags.map((tag) => (
              <div key={tag} className={`pill-v2 ${activeTag===tag?"active":""}`} style={{ fontSize:11, opacity:0.85 }}
                onClick={() => { haptic("light"); setActiveTag(activeTag===tag?null:tag); }}>
                #{tag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount banner */}
      {activeCat && (() => {
        const cat = categories.find(c => c.id===activeCat);
        if (!cat?.discount_amount) return null;
        return (
          <div style={{ padding:"0 16px" }}>
            <div className="discount-banner">
              <div>
                <div style={{ fontWeight:700,fontSize:13,color:"var(--success)" }}><PartyPopper size={12} style={{display:"inline",verticalAlign:"-2px"}}/> {cat.discount_label||"Special Discount"}</div>
                <div style={{ fontSize:12,color:"var(--hint)" }}>Save {formatPrice(cat.discount_amount)} on every design!</div>
              </div>
              <div className="discount-tag">-{formatPrice(cat.discount_amount)}</div>
            </div>
          </div>
        );
      })()}

      {/* Design grid - only this scrolls */}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ flex:1, overflowY:"auto", padding:"12px 16px", paddingBottom:"calc(140px + var(--safe-bottom))", position:"relative" }}
      >
        {!hasActiveFilter && recentDesigns.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--hint)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:6 }}>
              Recently Viewed
            </div>
            <div className="scroll-row">
              {recentDesigns.map((design) => (
                <div key={design.id}
                  onClick={() => { haptic("light"); setPreviewDesign(design); recordRecentlyViewed(design.id); }}
                  style={{
                    width:56, height:56, borderRadius:12, flexShrink:0, cursor:"pointer",
                    background:"var(--card)", border:"1.5px solid var(--border)",
                    overflow:"hidden",
                  }}>
                  {design.file_url ? (
                    <AnimationPreview url={design.file_url} fileType={design.file_type} size="100%" loop={false} autoplay={false} />
                  ) : emojis.tgs_empty_state ? (
                    <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <AnimationPreview url={emojis.tgs_empty_state} fileType={emojis.tgs_empty_state.endsWith("tgs")?"tgs":"json"} size="60%" autoplay loop/>
                    </div>
                  ) : (
                    <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}><Film size={16}/></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pullDist > 0 && (
          <div style={{ display:"flex",justifyContent:"center",alignItems:"center",height:pullDist,transition: pulling.current ? "none" : "height 0.2s ease" }}>
            <RefreshCw size={18} color="var(--accent)" style={{
              transform: `rotate(${Math.min(pullDist / PULL_THRESHOLD, 1) * 360}deg)`,
              opacity: Math.min(pullDist / PULL_THRESHOLD, 1),
            }} />
          </div>
        )}

        {loading ? (
          <div className="design-grid" style={gridStyle}>
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {hasActiveFilter ? (
              <>
                {emojis.tgs_empty_state
                  ? <AnimationPreview url={emojis.tgs_empty_state} fileType={emojis.tgs_empty_state.endsWith("tgs")?"tgs":"json"} size="100px" autoplay loop/>
                  : <div style={{ fontSize:40 }}><Search size={16}/></div>}
                <div style={{ fontWeight:600 }}>
                  {search ? `No results for "${search}"` : "No designs match these filters"}
                </div>
                <div style={{ fontSize:13 }}>Try a different search or clear filters</div>
                <button
                  className="btn btn-ghost"
                  style={{ marginTop:10 }}
                  onClick={() => { haptic("light"); setSearch(""); setActiveCat(null); setActiveTag(null); }}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                {emojis.tgs_empty_state
                  ? <AnimationPreview url={emojis.tgs_empty_state} fileType={emojis.tgs_empty_state.endsWith("tgs")?"tgs":"json"} size="100px" autoplay loop/>
                  : <div style={{ fontSize:40 }}><Film size={16}/></div>}
                <div style={{ fontWeight:600 }}>No designs yet</div>
                <div style={{ fontSize:13 }}>{isOwner?"Add designs from Owner Panel":"Check back soon!"}</div>
              </>
            )}
          </div>
        ) : (
          <div className="design-grid" style={gridStyle}>
            {sorted.map((design, index) => {
              const selected = isInCart(design.id);
              const isNew = design.created_at && (Date.now()-new Date(design.created_at).getTime()) < 7*24*60*60*1000;
              const isFree = voucherDesignIds.has(design.id);
              const discount = getDiscount(design);
              const badge = getBadge(design, { isFree, isNew: isNew && !selected });

              const cardClasses = [
                "design-card",
                selected ? (effects.cardSelectedGlow ? "selected" : "selected-simple") : "",
                effects.cardEntranceAnimation ? "card-animate-in" : "",
              ].filter(Boolean).join(" ");
              // Stagger the entrance animation by grid position, capped so large
              // grids don't take forever to finish revealing.
              const entranceDelay = effects.cardEntranceAnimation ? Math.min(index * 0.03, 0.45) : 0;

              return (
                <div key={design.id}
                  className={cardClasses}
                  style={{ animationDelay: `${entranceDelay}s` }}
                  onClick={() => toggleDesign(design)}>

                  {glowId===design.id && effects.cardPressGlow && <div className="design-card-press-glow"/>}

                  {selected && (
                    <div className="design-card-check">
                      <Check size={11} color="#000" strokeWidth={3}/>
                    </div>
                  )}

                  {badge === "free" && (
                    <div className={`new-badge ${effects.badgePulse ? "" : "no-pulse"}`} style={{ background:"linear-gradient(135deg,#FFD700,#FFA500)",top:"auto",bottom:6,left:6,right:"auto",zIndex:3 }}>
                      🎁 FREE
                    </div>
                  )}

                  {badge === "new" && (
                    <div className={`new-badge ${effects.badgePulse ? "" : "no-pulse"}`} style={{ padding:(emojis.tgs_new_badge && effects.badgeAnimatedEmoji)?"2px":undefined }}>
                      {(emojis.tgs_new_badge && effects.badgeAnimatedEmoji)
                        ? <AnimationPreview url={emojis.tgs_new_badge} fileType={emojis.tgs_new_badge.endsWith("tgs")?"tgs":"json"} size="18px" autoplay loop/>
                        : "NEW"}
                    </div>
                  )}

                  {/* Expand button */}
                  <button onClick={(e) => { e.stopPropagation(); haptic("light"); setPreviewDesign(design); recordRecentlyViewed(design.id); }}
                    style={{ position:"absolute",top:6,left:6,zIndex:2,width:22,height:22,borderRadius:6,background:"rgba(0,0,0,0.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0 }}>
                    <Maximize2 size={11} color="#fff"/>
                  </button>
                  {/* Favorite button */}
                  <button onClick={(e) => toggleFavorite(e, design.id)}
                    style={{ position:"absolute",bottom:6,right:6,zIndex:2,width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,0.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0 }}>
                    <Heart size={13} color={favIds.has(design.id) ? "#ff4d6d" : "#fff"} fill={favIds.has(design.id) ? "#ff4d6d" : "none"}/>
                  </button>

                  <div className="design-card-anim">
                    {design.file_url ? (
                      <LazyAnimationPreview
                        url={design.file_url}
                        fileType={design.file_type}
                        size="100%"
                        loop={false}
                        autoplay={false}
                        play={playIds.has(design.id)}
                        tintColor={design.type === "adaptive" ? getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() : null}
                      />
                    ) : emojis.tgs_empty_state ? (
                      <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <AnimationPreview url={emojis.tgs_empty_state} fileType={emojis.tgs_empty_state.endsWith("tgs")?"tgs":"json"} size="60%" autoplay loop/>
                      </div>
                    ) : (
                      <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}><Film size={16}/></div>
                    )}
                  </div>

                  <div className="design-card-info">
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", marginBottom:2 }}>
                      {design.category_name && <div className="design-card-cat" style={{ marginBottom:0 }}>{design.category_name}</div>}
                      <TypeBadge type={design.type} />
                    </div>
                    <div className="row" style={{ gap:6, alignItems:"baseline" }}>
                      <PriceTag basePrice={price(design)} discountAmount={discount} isFree={isFree} />
                      {design.order_count > 0 && (
                        <span style={{ fontSize:10, color:"var(--hint)", fontWeight:600, display:"flex", alignItems:"center", gap:2 }}>
                          <Flame size={10} /> {design.order_count}
                        </span>
                      )}
                    </div>
                    {(design.tags||[]).length>0 && (
                      <div style={{ display:"flex",flexWrap:"wrap",gap:3,marginTop:3 }}>
                        {(design.tags||[]).slice(0,2).map((tag) => (
                          <span key={tag} style={{ fontSize:9,fontWeight:600,padding:"1px 5px",borderRadius:4,background:"rgba(var(--accent-rgb),0.1)",color:"var(--accent)",border:"1px solid rgba(var(--accent-rgb),0.2)" }}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="design-card-accent"/>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(cart.length > 0 || cartVisible) && (
        <div style={ effects.cartBarBounce
          ? { animation: cart.length===0 ? "bounceOut 0.35s cubic-bezier(0.55,0,1,0.45) forwards" : "bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }
          : {} }>
          <CartBar />
        </div>
      )}

      {previewDesign && (
        <FullscreenPreview
          design={previewDesign}
          selected={isInCart(previewDesign.id)}
          onToggle={toggleDesign}
          onClose={() => setPreviewDesign(null)}
        />
      )}
    </div>
  );
}
