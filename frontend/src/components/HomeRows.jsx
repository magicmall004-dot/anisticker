import { useEffect, useRef, useState } from "react";
import { Flame, Sparkles, Heart, Clock, Plus, Check } from "lucide-react";
import AnimationPreview from "./AnimationPreview";
import { formatPrice } from "../lib/utils";
import { haptic } from "../lib/telegram";

// Mounts the animation only when the tile scrolls near the screen
function Lazy({ design }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on || !ref.current) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [on]);
  return (
    <div ref={ref} style={{ width:"100%", height:"100%" }}>
      {on && design.file_url && <AnimationPreview url={design.file_url} fileType={design.file_type} size="100%" autoplay={false} loop={false} />}
    </div>
  );
}

function Tile({ d, price, selectedOf, onOpen, onToggle, big }) {
  return (
    <div className={`hr-tile ${big ? "hr-big" : ""} ${selectedOf(d) ? "on" : ""}`} onClick={() => onOpen(d)}>
      <div className="hr-anim"><Lazy design={d} /></div>
      <div className="hr-info">
        <div className="hr-name">{d.name || d.category_name || "Design"}</div>
        <div className="hr-price">{formatPrice(price(d))}</div>
      </div>
      <button className="hr-add" onClick={(e) => { e.stopPropagation(); haptic("light"); onToggle(d); }}>
        {selectedOf(d) ? <Check size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={3} />}
      </button>
    </div>
  );
}

function Row({ icon: Icon, title, items, big, ...rest }) {
  if (!items.length) return null;
  return (
    <div className="hr-section">
      <div className="hr-title"><Icon size={14} /> {title}</div>
      <div className="hr-row">
        {items.map((d) => <Tile key={d.id} d={d} big={big} {...rest} />)}
      </div>
    </div>
  );
}

export default function HomeRows({ designs, favIds, recent, price, isInCart, onOpen, onToggle }) {
  if (!designs || designs.length < 4) return null;
  const byCount = [...designs].sort((a, b) => (b.order_count || 0) - (a.order_count || 0));
  const trending = byCount.filter((d) => (d.order_count || 0) > 0).slice(0, 10);
  const fresh = [...designs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);
  const favs = designs.filter((d) => favIds.has(d.id)).slice(0, 10);
  const common = { price, onOpen, onToggle };
  const sel = (d) => isInCart(d.id);

  return (
    <div className="hr-wrap">
      <Row icon={Sparkles} title="Featured" big items={(trending.length >= 3 ? trending : fresh).slice(0, 6)} selectedOf={sel} {...common} />
      <Row icon={Flame} title="Trending" items={trending} selectedOf={sel} {...common} />
      <Row icon={Sparkles} title="New" items={fresh} selectedOf={sel} {...common} />
      <Row icon={Heart} title="Your favorites" items={favs} selectedOf={sel} {...common} />
      <Row icon={Clock} title="Recently viewed" items={(recent || []).slice(0, 10)} selectedOf={sel} {...common} />
      <div className="hr-title" style={{ marginTop:6 }}>All designs</div>
    </div>
  );
}
