import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Gift, Trophy, Users } from "lucide-react";
import api from "../lib/api";
import { showBackButton, hideBackButton } from "../lib/telegram";
import AnimationPreview from "../components/AnimationPreview";
import { formatPrice } from "../lib/utils";

export default function GiveawayHistory() {
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    showBackButton(() => navigate(-1));
    api.get("/giveaway/history/all").then((r) => setGiveaways(r.data)).finally(() => setLoading(false));
    return hideBackButton;
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}><ChevronLeft size={22}/></button>
        <div className="page-title"><Gift size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Past Giveaways</div>
      </div>
      <div className="page-body">
        {loading ? <div style={{ display:"flex",justifyContent:"center",padding:40 }}><div className="spinner"/></div>
        : giveaways.length===0 ? <div className="empty-state"><Gift size={32}/><div>No past giveaways yet</div></div>
        : giveaways.map((g) => (
          <div key={g.id} className="card" onClick={() => navigate(`/giveaway/${g.id}`)} style={{ cursor:"pointer" }}>
            <div className="row" style={{ gap:10 }}>
              {g.tgs_url ? <AnimationPreview url={g.tgs_url} fileType={g.tgs_url.endsWith("tgs")?"tgs":"json"} size="44px" autoplay loop/> : <Gift size={32} color="#a78bfa"/>}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14 }}>{g.title}</div>
                <div style={{ display:"flex",gap:10,fontSize:11,color:"var(--hint)",marginTop:2 }}>
                  <span style={{ display:"flex",alignItems:"center",gap:3 }}><Users size={10}/> {g.participant_count}</span>
                  <span style={{ display:"flex",alignItems:"center",gap:3 }}><Trophy size={10}/> {g.winner_count} winner{g.winner_count>1?"s":""}</span>
                </div>
              </div>
              {g.has_joined && <span style={{ fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:99,background:"rgba(34,197,94,0.15)",color:"var(--success)" }}>Joined</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
