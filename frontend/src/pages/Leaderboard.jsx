import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trophy, Crown, Clock } from "lucide-react";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, haptic } from "../lib/telegram";
import { useEmojis } from "../context/EmojiContext";
import AnimationPreview from "../components/AnimationPreview";
import AnimatedNumber from "../components/AnimatedNumber";
import TierBadge from "../components/TierBadge";
import RoleBadge from "../components/RoleBadge";
import api from "../lib/api";

const RANK_STYLES = {
  1: { emoji:"🥇", color:"#FFD700" },
  2: { emoji:"🥈", color:"#C0C0C0" },
  3: { emoji:"🥉", color:"#CD7F32" },
};
const BAR_H = { 1: 104, 2: 78, 3: 58 };
const TABS = [
  { id:"today", label:"Today" },
  { id:"week",  label:"This Week" },
  { id:"all",   label:"All Time" },
];
const EMPTY = {
  today: "No orders today yet. Be the first!",
  week:  "No orders this week yet. Be the first!",
  all:   "No orders yet",
};

// Time until the next reset, in Myanmar time (UTC+6:30)
function msUntilReset(period) {
  if (period === "all") return null;
  const DAY = 86400000;
  const mm = Date.now() + 6.5 * 3600000;
  const intoDay = mm % DAY;
  if (period === "today") return DAY - intoDay;
  const day = new Date(mm).getUTCDay();            // 0 = Sunday
  const daysToMon = ((8 - day) % 7) || 7;
  return daysToMon * DAY - intoDay;
}
function fmt(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
  return d > 0 ? `${d}d ${h}h` : `${h}h ${mi}m`;
}

function Avatar({ leader, size, color }) {
  const border = color ? `2px solid ${color}` : "2px solid rgba(255,255,255,0.1)";
  if (leader.photo_url) {
    return <img src={leader.photo_url} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border }} />;
  }
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"rgba(var(--accent-rgb),0.1)", border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.4, fontWeight:700, color:"var(--accent)" }}>
      {(leader.first_name || "?")[0]}
    </div>
  );
}
const roleMark = (r) => r === "owner" ? " 👑" : r === "reseller" ? " ⭐" : "";

export default function Leaderboard() {
  const navigate = useNavigate();
  const emojis = useEmojis();
  const [period, setPeriod] = useState("today");
  const [leaders, setLeaders] = useState([]);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState(msUntilReset("today"));

  useEffect(() => {
    showBackButton(() => navigate(-1));
    return hideBackButton;
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get("/leaderboard/", { params: { period } }).then((r) => r.data).catch(() => []),
      api.get("/leaderboard/me", { params: { period } }).then((r) => r.data).catch(() => null),
    ]).then(([list, me]) => {
      if (!alive) return;
      setLeaders(list);
      setMine(me);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [period]);

  useEffect(() => {
    setLeft(msUntilReset(period));
    const t = setInterval(() => setLeft(msUntilReset(period)), 30000);
    return () => clearInterval(t);
  }, [period]);

  function pick(id) {
    if (id === period) return;
    haptic("light");
    setPeriod(id);
  }

  const idx = TABS.findIndex((t) => t.id === period);
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);
  const inList = leaders.some((l) => l.is_me);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}><ChevronLeft size={22} /></button>
        <div className="page-title"><Trophy size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Leaderboard</div>
      </div>
      <div className="page-body">
        <div className="lb-tabs">
          <div className="lb-tab-pill" style={{ transform:`translateX(${idx * 100}%)` }} />
          {TABS.map((t) => (
            <button key={t.id} className={`lb-tab ${t.id === period ? "active" : ""}`} onClick={() => pick(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="lb-meta">
          {left !== null
            ? <span className="lb-reset"><Clock size={12} /> Resets in {fmt(left)}</span>
            : <span className="lb-reset">Ranked by total spending</span>}
          {mine?.rank && (
            <span className="lb-mychip">Your rank #{mine.rank} · {formatPrice(mine.total_spent)}</span>
          )}
        </div>

        {loading ? <div style={{ display:"flex",justifyContent:"center",padding:40 }}><div className="spinner"/></div>
        : leaders.length === 0 ? (
          <div className="empty-state" key={period}>
            {emojis.tgs_trophy
              ? <AnimationPreview url={emojis.tgs_trophy} fileType={emojis.tgs_trophy.endsWith("tgs")?"tgs":"json"} size="64px" autoplay loop />
              : <Trophy size={36}/>}
            <div>{EMPTY[period]}</div>
          </div>
        ) : (
          <div key={period}>
            <div className="lb-podium">
              {podium.map((leader) => {
                const st = RANK_STYLES[leader.rank] || RANK_STYLES[3];
                const tgsRank = leader.rank===1?emojis.tgs_rank1:leader.rank===2?emojis.tgs_rank2:emojis.tgs_rank3;
                const first = leader.rank === 1;
                return (
                  <div key={leader.rank} className={`lb-col lb-col-${leader.rank}`}>
                    <div className="lb-person">
                      {first && <Crown size={20} color="#FFD700" className="lb-crown" />}
                      <div className={first ? "lb-avatar-glow" : ""} style={{ "--c": st.color }}>
                        <Avatar leader={leader} size={first ? 64 : 52} color={st.color} />
                      </div>
                      <div className="lb-name"><RoleBadge role={leader.role} size={14} />{leader.is_me ? "You" : leader.first_name}<TierBadge spent={leader.lifetime_spent} size={14} /></div>
                      <div className="lb-amount" style={{ color: st.color }}>
                        <AnimatedNumber value={Number(leader.total_spent) || 0} format={formatPrice} duration={1100} />
                      </div>
                    </div>
                    <div className="lb-bar" style={{ height: BAR_H[leader.rank] || 58, "--c": st.color }}>
                      {tgsRank
                        ? <AnimationPreview url={tgsRank} fileType={tgsRank.endsWith("tgs")?"tgs":"json"} size="34px" autoplay loop />
                        : <span style={{ fontSize:26 }}>{st.emoji}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {rest.length > 0 && (
              <div className="stagger lb-list">
                {rest.map((leader, i) => (
                  <div key={leader.rank} className={`card ${leader.is_me ? "lb-mine" : ""}`} style={{ "--i": Math.min(i, 10) }}>
                    <div className="row" style={{ gap:12 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:"var(--hint)", minWidth:32, textAlign:"center" }}>
                        {emojis.tgs_star
                          ? <AnimationPreview url={emojis.tgs_star} fileType={emojis.tgs_star.endsWith("tgs")?"tgs":"json"} size="24px" autoplay loop />
                          : `#${leader.rank}`}
                      </div>
                      <Avatar leader={leader} size={40} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>
                          <RoleBadge role={leader.role} size={16} />{leader.is_me ? "You" : `${leader.first_name} ${leader.last_name || ""}`}<TierBadge spent={leader.lifetime_spent} size={16} />
                        </div>
                        {leader.username && <div style={{ fontSize:12, color:"var(--hint)" }}>@{leader.username}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:800, fontSize:14, color:"var(--accent)" }}>{formatPrice(leader.total_spent)}</div>
                        <div style={{ fontSize:10, color:"var(--hint)" }}>spent</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mine?.rank && !inList && (
              <div className="card lb-mine" style={{ marginTop:10, textAlign:"center", fontWeight:700, fontSize:13 }}>
                You are #{mine.rank} · {formatPrice(mine.total_spent)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
