import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Gift, Users, Trophy, Clock, Sparkles, Coins, PartyPopper } from "lucide-react";
import { getGiveawayDetail, joinGiveaway } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, haptic, hapticNotification, showConfirm } from "../lib/telegram";
import AnimationPreview from "../components/AnimationPreview";
import Confetti from "../components/Confetti";

function getTimeParts(endAt) {
  const diff = Math.max(0, new Date(endAt).getTime() - Date.now());
  return {
    days: Math.floor(diff/86400000),
    hours: Math.floor((diff%86400000)/3600000),
    minutes: Math.floor((diff%3600000)/60000),
    seconds: Math.floor((diff%60000)/1000),
    ended: diff<=0
  };
}

function TimeBox({ value, label }) {
  return (
    <div style={{ background:"var(--card)",borderRadius:10,padding:"10px 4px",textAlign:"center",minWidth:54,border:"1px solid rgba(var(--accent2-rgb),0.2)" }}>
      <div key={value} className="gv-tick" style={{ fontSize:22,fontWeight:800,color:"#a78bfa",fontVariantNumeric:"tabular-nums" }}>{String(value).padStart(2,"0")}</div>
      <div style={{ fontSize:9,color:"var(--hint)",textTransform:"uppercase",letterSpacing:".05em" }}>{label}</div>
    </div>
  );
}

export default function GiveawayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [giveaway, setGiveaway] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [joining,  setJoining]  = useState(false);
  const [time,     setTime]     = useState(null);
  const [justEnded,setJustEnded]= useState(false);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    load();
    return hideBackButton;
  }, [id]);

  async function load() {
    try { const g = await getGiveawayDetail(id); setGiveaway(g); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!giveaway?.end_at || giveaway.status !== "active") return;
    setTime(getTimeParts(giveaway.end_at));
    const t = setInterval(() => {
      const parts = getTimeParts(giveaway.end_at);
      setTime(parts);
      if (parts.ended) { clearInterval(t); setJustEnded(true); setTimeout(() => load(), 1500); }
    }, 1000);
    return () => clearInterval(t);
  }, [giveaway?.end_at, giveaway?.status]);

  async function handleJoin() {
    haptic("medium");
    const ok = await showConfirm(`Join "${giveaway.title}"?`);
    if (!ok) return;
    setJoining(true);
    try {
      await joinGiveaway(giveaway.id);
      hapticNotification("success");
      setGiveaway((g) => ({ ...g, has_joined:true, participant_count:g.participant_count+1 }));
    } catch (e) { hapticNotification("error"); alert(e.response?.data?.detail||"Failed to join"); }
    finally { setJoining(false); }
  }

  if (loading) return <div className="page"><div style={{ display:"flex",justifyContent:"center",padding:80 }}><div className="spinner"/></div></div>;
  if (!giveaway) return <div className="page"><div className="empty-state">Giveaway not found</div></div>;

  const isDrawn = giveaway.status === "drawn";
  const myWin = giveaway.winners_display?.find((w) => w.is_me);

  return (
    <div className="page">
      {isDrawn && myWin && <Confetti />}
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}><ChevronLeft size={22}/></button>
        <div className="page-title"><Gift size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Giveaway</div>
      </div>
      <div className="page-body gv-auto">
        <div className="card-glow" style={{ textAlign:"center",padding:"24px 16px" }}>
          {giveaway.tgs_url
            ? <AnimationPreview url={giveaway.tgs_url} fileType={giveaway.tgs_url.endsWith("tgs")?"tgs":"json"} size="100px" autoplay loop />
            : <span className="gv-float"><Gift size={64} color="#a78bfa" /></span>}
          <div style={{ fontWeight:800,fontSize:18,marginTop:10 }}>{giveaway.title}</div>
          {giveaway.description && <div style={{ fontSize:13,color:"var(--hint)",marginTop:6,lineHeight:1.6 }}>{giveaway.description}</div>}
        </div>

        {giveaway.status==="active" && time && !time.ended && (
          <div className="card">
            <div className="section-title" style={{ textAlign:"center",marginBottom:10 }}><Clock size={12} style={{ display:"inline",marginRight:4 }}/>Time Remaining</div>
            <div style={{ display:"flex",justifyContent:"center",gap:8 }}>
              {time.days>0 && <TimeBox value={time.days} label="Days"/>}
              <TimeBox value={time.hours} label="Hours"/>
              <TimeBox value={time.minutes} label="Min"/>
              <TimeBox value={time.seconds} label="Sec"/>
            </div>
          </div>
        )}

        <div className="section-title">Prize Pool</div>
        <div className="card">
          {giveaway.prize_type==="cash" ? (
            <div className="row" style={{ gap:10 }}>
              <div style={{ fontSize:32 }}><Coins size={16}/></div>
              <div>
                <div style={{ fontWeight:700,fontSize:16 }}>{giveaway.cash_mode==="exact"?`${formatPrice(giveaway.prize_amount)} each winner`:`${formatPrice(giveaway.prize_amount)} total pool`}</div>
                <div style={{ fontSize:12,color:"var(--hint)" }}>{giveaway.cash_mode==="split"&&giveaway.winner_count>0&&`≈ ${formatPrice(giveaway.prize_amount/giveaway.winner_count)} per winner`}</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:13,color:"var(--hint)",marginBottom:8 }}>Free design sticker(s) — winners get it free on next order</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {giveaway.design_pool?.map((d,idx) => (
                  <div key={idx} style={{ width:52,height:52,borderRadius:10,overflow:"hidden",background:"var(--card)",border:"1px solid var(--border)" }}>
                    {d.file_url ? <AnimationPreview url={d.file_url} fileType={d.file_type} size="52px" autoplay loop/> : <Film size={20}/>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <div className="card" style={{ textAlign:"center",padding:"14px 10px" }}>
            <Users size={18} color="var(--accent)"/>
            <div style={{ fontWeight:800,fontSize:18,marginTop:4 }}>{giveaway.participant_count}</div>
            <div style={{ fontSize:11,color:"var(--hint)" }}>Participants</div>
          </div>
          <div className="card" style={{ textAlign:"center",padding:"14px 10px" }}>
            <Trophy size={18} color="#FFD700"/>
            <div style={{ fontWeight:800,fontSize:18,marginTop:4 }}>{giveaway.winner_count}</div>
            <div style={{ fontSize:11,color:"var(--hint)" }}>Winner Slots</div>
          </div>
        </div>

        {giveaway.winners_display?.length>0 && (
          <>
            <div className="section-title"><Trophy size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Winners</div>
            {giveaway.winners_display.map((w,idx) => (
              <div key={idx} className={`card gv-winner ${w.is_me ? "gv-me" : ""}`} style={{ "--i": Math.min(idx, 10), border:w.is_me?"1px solid #FFD700":"1px solid rgba(255,255,255,0.07)",background:w.is_me?"rgba(255,215,0,0.06)":undefined }}>
                <div className="row" style={{ gap:10 }}>
                  {w.photo_url ? <img src={w.photo_url} alt="" style={{ width:36,height:36,borderRadius:"50%",objectFit:"cover" }}/> : <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{(w.first_name||"?")[0]}</div>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:13 }}>{w.first_name} {w.last_name} {w.is_me&&"(You!)"}</div>
                    {w.username && <div style={{ fontSize:11,color:"var(--hint)" }}>@{w.username}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {w.prize==="cash" ? <div style={{ fontWeight:800,color:"var(--success)" }}>+{formatPrice(w.amount)}</div>
                    : <div className="row" style={{ gap:6 }}>
                        {w.design_file_url && <div style={{ width:28,height:28,borderRadius:6,overflow:"hidden" }}><AnimationPreview url={w.design_file_url} fileType={w.design_file_type} size="28px" autoplay loop/></div>}
                        <span style={{ fontSize:12,fontWeight:600,color:"var(--accent)" }}>{w.design_name}</span>
                      </div>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {giveaway.status==="active" && (
          giveaway.has_joined ? (
            <div style={{ textAlign:"center",padding:14,borderRadius:"var(--radius)",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",color:"var(--success)",fontWeight:700 }}>
              ✓ You've joined this giveaway. Good luck! 🍀
            </div>
          ) : (
            <button className="btn btn-primary btn-full" disabled={joining} onClick={handleJoin} style={{ padding:16 }}>
              {joining ? "Joining…" : <><PartyPopper size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Join Giveaway</>}
            </button>
          )
        )}
      </div>
    </div>
  );
}
