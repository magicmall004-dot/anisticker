import { useEffect, useState } from "react";

export default function AchievementToast({ message, emoji = "🎉", onDone }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setShow(false); onDone?.(); }, 3600);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="achievement-toast">
      <div style={{ fontSize:28 }}>{emoji}</div>
      <div style={{ color:"#fff", fontWeight:700, fontSize:14, lineHeight:1.4 }}>{message}</div>
    </div>
  );
}
