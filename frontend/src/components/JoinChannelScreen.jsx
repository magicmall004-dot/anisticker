import { useState } from "react";
import { Megaphone, CheckCircle } from "lucide-react";
import { useEmojis } from "../context/EmojiContext";
import AnimationPreview from "./AnimationPreview";
import { openTelegramLink, haptic, hapticNotification } from "../lib/telegram";

export default function JoinChannelScreen({ channelUrl, onVerified, onRecheck }) {
  const emojis = useEmojis();
  const [checking, setChecking] = useState(false);

  async function handleCheck() {
    haptic("medium");
    setChecking(true);
    try {
      const isMember = await onRecheck();
      if (isMember) { hapticNotification("success"); onVerified(); }
      else hapticNotification("error");
    } finally { setChecking(false); }
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh",
      padding:"32px 24px", textAlign:"center", gap:20, background:"var(--bg)", position:"relative", zIndex:1,
    }}>
      {emojis.tgs_loading ? (
        <AnimationPreview url={emojis.tgs_loading} fileType={emojis.tgs_loading.endsWith("tgs")?"tgs":"json"} size="120px" autoplay loop />
      ) : <div style={{ fontSize:64 }}><Megaphone size={32}/></div>}
      <div>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:10, background:"linear-gradient(135deg,#04D9FF,#7eeeff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Join Our Channel First
        </div>
        <div style={{ fontSize:14, color:"var(--hint)", lineHeight:1.7, maxWidth:300 }}>
          To use MagicMall, please join our official Telegram channel for updates and offers.
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:300 }}>
        <button className="btn btn-primary btn-full" style={{ padding:14 }}
          onClick={() => { haptic("light"); openTelegramLink(channelUrl); }}>
          <Megaphone size={16} style={{display:"inline",verticalAlign:"-3px"}}/> Join Channel
        </button>
        <button className="btn btn-secondary btn-full" disabled={checking} onClick={handleCheck} style={{ padding:14 }}>
          {checking ? "Checking…" : <><CheckCircle size={16} style={{display:"inline",verticalAlign:"-3px"}}/> I've Joined</>}
        </button>
      </div>
    </div>
  );
}
