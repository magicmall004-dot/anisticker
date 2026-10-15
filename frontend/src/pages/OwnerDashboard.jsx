import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Layers, CreditCard, Users, Settings, Wallet, Sparkles, Gift, TrendingUp, Send, Type, Tag } from "lucide-react";
import { useApp } from "../context/AppContext";
import OwnerOrders    from "./OwnerOrders";
import OwnerDesigns   from "./OwnerDesigns";
import OwnerPayments  from "./OwnerPayments";
import OwnerUsers     from "./OwnerUsers";
import OwnerSettings  from "./OwnerSettings";
import OwnerBalance   from "./OwnerBalance";
import OwnerOnboarding from "./OwnerOnboarding";
import OwnerRedeem    from "./OwnerRedeem";
import OwnerGiveaway  from "./OwnerGiveaway";
import OwnerMessages  from "./OwnerMessages";
import OwnerAnalytics from "./OwnerAnalytics";
import OwnerBroadcast from "./OwnerBroadcast";
import OwnerFonts     from "./OwnerFonts";
import OwnerCategories from "./OwnerCategories";
import OwnerEmojiPacks from "./OwnerEmojiPacks";

const TABS = [
  { id:"orders",   label:"Orders",   Icon:Package    },
  { id:"designs",  label:"Designs",  Icon:Layers     },
  { id:"payments", label:"Payments", Icon:CreditCard },
  { id:"users",    label:"Users",    Icon:Users      },
  { id:"settings", label:"Settings", Icon:Settings   },
  { id:"balance",  label:"Balance",  Icon:Wallet     },
  { id:"onboard",  label:"Welcome",  Icon:Sparkles   },
  { id:"redeem",   label:"Codes",    Icon:Gift       },
  { id:"giveaway", label:"Giveaway", Icon:Sparkles   },
  { id:"messages",   label:"Messages",  Icon:Sparkles   },
  { id:"analytics",  label:"Analytics", Icon:TrendingUp },
  { id:"broadcast",  label:"Broadcast", Icon:Send       },
  { id:"fonts",      label:"Fonts",     Icon:Type       },
  { id:"categories", label:"Categories", Icon:Tag        },
  { id:"emojipacks", label:"Emoji Packs", Icon:Sparkles   },
];

export default function OwnerDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");
  const rowRef = useRef(null);
  useEffect(() => {
    const el = rowRef.current && rowRef.current.querySelector(".od-tab-on");
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);

  if (user?.role !== "owner") { navigate("/"); return null; }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate("/")}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">Owner Panel</div>
      </div>

      {/* Horizontal scrollable tab row */}
      <div ref={rowRef} className="od-tabs" style={{
        overflowX:"auto", display:"flex", gap:6, padding:"8px 16px",
        scrollbarWidth:"none", borderBottom:"1px solid rgba(255,255,255,0.06)",
        position:"sticky", top:52, zIndex:40,
        background:"rgba(8,8,12,0.92)", backdropFilter:"blur(20px)",
      }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`od-tab ${tab===id?"od-tab-on":""}`} onClick={() => setTab(id)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"7px 14px", borderRadius:99, border:"none",
            cursor:"pointer", whiteSpace:"nowrap", fontSize:12, fontWeight:700,
            flexShrink:0,
            background: tab===id ? "rgba(var(--accent-rgb),0.15)" : "rgba(255,255,255,0.05)",
            color: tab===id ? "var(--accent)" : "var(--hint)",
            boxShadow: tab===id ? "0 0 10px rgba(var(--accent-rgb),0.2)" : "none",
            transition:"all .15s",
          }}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div key={tab} className="od-content">
        {tab === "orders"   && <OwnerOrders />}
        {tab === "designs"  && <OwnerDesigns />}
        {tab === "payments" && <OwnerPayments />}
        {tab === "users"    && <OwnerUsers />}
        {tab === "settings" && <OwnerSettings />}
        {tab === "balance"  && <OwnerBalance />}
        {tab === "onboard"  && <OwnerOnboarding />}
        {tab === "redeem"   && <OwnerRedeem />}
        {tab === "giveaway" && <OwnerGiveaway />}
        {tab === "messages"  && <OwnerMessages />}
        {tab === "analytics" && <OwnerAnalytics />}
        {tab === "broadcast" && <OwnerBroadcast />}
        {tab === "fonts"     && <OwnerFonts />}
        {tab === "categories" && <OwnerCategories />}
        {tab === "emojipacks" && <OwnerEmojiPacks />}
      </div>
    </div>
  );
}
