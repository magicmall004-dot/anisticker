import { useState, useEffect } from "react";

function getThemeColors() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return ["#FFD580","#FFA751","#04D9FF","#ffffff","#FFE5B4"];
  if (hour >= 11 && hour < 17) return ["#04D9FF","#7eeeff","#FFD700","#ffffff","#0099bb"];
  if (hour >= 17 && hour < 21) return ["#FF6B9D","#A78BFA","#04D9FF","#FFA751","#ffffff"];
  return ["#7C3AED","#04D9FF","#A78BFA","#ffffff","#3B82F6"];
}

export default function Confetti() {
  const [pieces, setPieces] = useState([]);
  const COLORS = getThemeColors();

  useEffect(() => {
    const arr = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 2 + Math.random() * 1.5,
      delay: Math.random() * 0.3,
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          width: p.size, height: p.size * 0.4,
          background: p.color,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </>
  );
}
