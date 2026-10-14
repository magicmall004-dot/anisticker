import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Users, Clock, Check } from "lucide-react";
import { getActiveGiveaway, joinGiveaway } from "../lib/api";
import { haptic, hapticNotification, showConfirm } from "../lib/telegram";
import AnimationPreview from "./AnimationPreview";

function formatTimeLeft(endAt) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return "Ending...";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) { const d = Math.floor(h / 24); return `${d}d ${h % 24}h left`; }
  return `${h}h ${m}m left`;
}

export default function GiveawayBanner() {
  const navigate = useNavigate();
  const [giveaway, setGiveaway] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [joining,  setJoining]  = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!giveaway?.end_at) return;
    setTimeLeft(formatTimeLeft(giveaway.end_at));
    const t = setInterval(() => setTimeLeft(formatTimeLeft(giveaway.end_at)), 60000);
    return () => clearInterval(t);
  }, [giveaway]);

  async function load() {
    try { const g = await getActiveGiveaway(); setGiveaway(g); }
    catch (e) {} finally { setLoading(false); }
  }

  async function handleJoin(e) {
    e.stopPropagation();
    haptic("medium");
    const ok = await showConfirm(`Join "${giveaway.title}"?`);
    if (!ok) return;
    setJoining(true);
    try {
      await joinGiveaway(giveaway.id);
      hapticNotification("success");
      setGiveaway((g) => ({ ...g, has_joined: true, participant_count: g.participant_count + 1 }));
    } catch (e) {
      hapticNotification("error");
      alert(e.response?.data?.detail || "Failed to join");
    } finally { setJoining(false); }
  }

  if (loading || !giveaway || giveaway.status !== "active") return null;

  return (
    <div style={{ padding:"0 16px" }}>
      <div onClick={() => navigate(`/giveaway/${giveaway.id}`)} style={{
        background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(4,217,255,0.1))",
        border:"1px solid rgba(124,58,237,0.3)", borderRadius:"var(--radius)",
        padding:14, display:"flex", alignItems:"center", gap:12,
        boxShadow:"0 0 24px rgba(124,58,237,0.15)", cursor:"pointer",
      }}>
        <div style={{ width:48,height:48,flexShrink:0,borderRadius:12,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
          {giveaway.tgs_url ? (
            <AnimationPreview url={giveaway.tgs_url} fileType={giveaway.tgs_url.endsWith("tgs")?"tgs":"json"} size="48px" autoplay loop />
          ) : <Gift size={22} color="#a78bfa" />}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:14, color:"#fff" }}><Gift size={14} style={{display:"inline",verticalAlign:"-2px"}}/> {giveaway.title}</div>
          <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--hint)", marginTop:2 }}>
            <span style={{ display:"flex",alignItems:"center",gap:3 }}><Clock size={10} /> {timeLeft}</span>
            <span style={{ display:"flex",alignItems:"center",gap:3 }}><Users size={10} /> {giveaway.participant_count} joined</span>
          </div>
        </div>
        {giveaway.has_joined ? (
          <div style={{ fontSize:11,fontWeight:700,color:"var(--success)",padding:"6px 12px",borderRadius:99,background:"rgba(34,197,94,0.15)" }}><Check size={12} style={{display:"inline",verticalAlign:"-1px"}}/> Joined</div>
        ) : (
          <button className="btn btn-primary" style={{ padding:"8px 14px",fontSize:12 }} disabled={joining} onClick={handleJoin}>
            {joining ? "…" : "Join"}
          </button>
        )}
      </div>
    </div>
  );
}
