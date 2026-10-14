import AnimationPreview from "./AnimationPreview";
import { Wrench } from "lucide-react";

export default function MaintenanceScreen({ message, tgsUrl }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh",
      padding:"32px 24px", textAlign:"center", gap:20, background:"var(--bg)",
    }}>
      {tgsUrl ? (
        <AnimationPreview url={tgsUrl} fileType={tgsUrl.endsWith("tgs")?"tgs":"json"} size="140px" autoplay loop />
      ) : <div style={{ fontSize:72 }}><Wrench size={40}/></div>}
      <div>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8, background:"linear-gradient(135deg,#04D9FF,#7eeeff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Under Maintenance
        </div>
        <div style={{ fontSize:14, color:"var(--hint)", lineHeight:1.7, maxWidth:300 }}>
          {message || "We are currently under maintenance. Please check back soon!"}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--hint)" }}>
        <div className="spinner" style={{ width:16, height:16, borderWidth:2 }} />
        We'll be back shortly
      </div>
    </div>
  );
}
