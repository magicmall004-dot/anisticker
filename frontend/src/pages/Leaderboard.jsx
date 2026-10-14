import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trophy, Crown } from "lucide-react";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton } from "../lib/telegram";
import { useEmojis } from "../context/EmojiContext";
import AnimationPreview from "../components/AnimationPreview";
import AnimatedNumber from "../components/AnimatedNumber";
import api from "../lib/api";

const RANK_STYLES = {
  1: { emoji:"🥇", color:"#FFD700", bg:"rgba(255,215,0,0.1)" },
  2: { emoji:"🥈", color:"#C0C0C0", bg:"rgba(192,192,192,0.1)" },
  3: { emoji:"🥉", color:"#CD7F32", bg:"rgba(205,127,50,0.1)" },
};
const BAR_H = { 1: 104, 2: 78, 3: 58 };

function Avatar({ leader, size, color }) {
  const border = color ? `2px solid ${color}` : "2px solid rgba(255,255,255,0.1)";
  if (leader.photo_url) {
    return <img src={leader.photo_url} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border }} />;
  }
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"rgba(4,217,255,0.1)", border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.4, fontWeight:700, color:"var(--accent)" }}>
      {(leader.first_name || "?")[0]}
    </div>
  );
}

function roleMark(role) {
  return role === "owner" ? " 👑" : role === "reseller" ? " ⭐" : "";
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const emojis = useEmojis();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    api.get("/leaderboard/").then((r) => setLeaders(r.data)).finally(() => setLoading(false));
    return hideBackButton;
  }, []);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  // Visual order: 2nd, 1st, 3rd
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}><ChevronLeft size={22} /></button>
        <div className="page-title"><Trophy size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Leaderboard</div>
      </div>
      <div className="page-body">
        <div className="card-glow lb-hero">
          <div className="lb-hero-icon">
            {emojis.tgs_trophy
              ? <AnimationPreview url={emojis.tgs_trophy} fileType={emojis.tgs_trophy.endsWith("tgs")?"tgs":"json"} size="56px" autoplay loop />
              : <Trophy size={30} color="var(--accent)" />}
          </div>
          <div style={{ fontWeight:800, fontSize:17, marginTop:8 }}>Top Customers</div>
          <div style={{ fontSize:12, color:"var(--hint)", marginTop:4 }}>Ranked by total spending · Usernames are partially hidden</div>
        </div>

        {loading ? <div style={{ display:"flex",justifyContent:"center",padding:40 }}><div className="spinner"/></div>
        : leaders.length===0 ? <div className="empty-state"><Trophy size={36}/><div>No orders yet</div></div>
        : (
          <>
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
                      <div className="lb-name">{leader.first_name}{roleMark(leader.role)}</div>
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
                {rest.map((leader, i) => {
                  const tgsRank = emojis.tgs_star;
                  return (
                    <div key={leader.rank} className="card" style={{ "--i": Math.min(i, 10) }}>
                      <div className="row" style={{ gap:12 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:"var(--hint)", minWidth:32, textAlign:"center" }}>
                          {tgsRank
                            ? <AnimationPreview url={tgsRank} fileType={tgsRank.endsWith("tgs")?"tgs":"json"} size="24px" autoplay loop />
                            : `#${leader.rank}`}
                        </div>
                        <Avatar leader={leader} size={40} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{leader.first_name} {leader.last_name}{roleMark(leader.role)}</div>
                          {leader.username && <div style={{ fontSize:12, color:"var(--hint)" }}>@{leader.username}</div>}
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontWeight:800, fontSize:14, color:"var(--accent)" }}>{formatPrice(leader.total_spent)}</div>
                          <div style={{ fontSize:10, color:"var(--hint)" }}>total spent</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
