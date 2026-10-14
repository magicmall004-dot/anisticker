import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import AnimationPreview from "./AnimationPreview";
import { haptic } from "../lib/telegram";

export default function OnboardingScreen({ pages, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const idxRef = useRef(0);
  const touchX = useRef(null);
  const tg = window.Telegram?.WebApp;
  const isLast = idx === pages.length - 1;
  const page = pages[idx];

  function go(n) {
    if (n < 0 || n > pages.length - 1 || n === idxRef.current) return;
    setDir(n > idxRef.current ? 1 : -1);
    idxRef.current = n;
    setIdx(n);
  }

  function next() {
    haptic("medium");
    if (idxRef.current >= pages.length - 1) onFinish();
    else go(idxRef.current + 1);
  }

  function onTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    haptic("light");
    go(idxRef.current + (dx < 0 ? 1 : -1));
  }

  useEffect(() => { idxRef.current = idx; }, [idx]);

  useEffect(() => {
    if (!tg) return;
    const btn = tg.MainButton;
    btn.setText(isLast ? "Get Started 🚀" : "Next →");
    btn.color = "#04D9FF";
    btn.textColor = "#000000";
    try { btn.offClick(next); } catch(e){}
    btn.onClick(next);
    btn.show();
    return () => { try { btn.offClick(next); } catch(e){} };
  }, [isLast]);

  useEffect(() => {
    return () => {
      if (!tg) return;
      try { tg.MainButton.hide(); } catch(e){}
    };
  }, []);

  if (!page) return null;

  return (
    <div className="ob-root" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="ob-orbs">
        <div className="ob-orb ob-orb-1" />
        <div className="ob-orb ob-orb-2" />
        <div className="ob-orb ob-orb-3" />
      </div>

      <div className="ob-top">
        <div className="ob-counter">{idx + 1} / {pages.length}</div>
        <button onClick={onFinish} className="ob-skip">Skip</button>
      </div>

      <div className="ob-content">
        <div key={idx} className="ob-slide" style={{ "--dx": dir > 0 ? "48px" : "-48px" }}>
          <div className="ob-hero">
            <div className="ob-ring" />
            <div className="ob-float">
              {page.tgs_url ? (
                <AnimationPreview
                  url={page.tgs_url}
                  fileType={page.tgs_url.endsWith("tgs") ? "tgs" : "json"}
                  size="180px" autoplay loop
                />
              ) : (
                <div className="ob-fallback"><Sparkles size={48} /></div>
              )}
            </div>
          </div>

          <div className="ob-title">{page.title}</div>
          <div className="ob-desc">{page.description}</div>
        </div>
      </div>

      <div className="ob-dots">
        {pages.map((_, i) => (
          <div key={i} onClick={() => go(i)} className={`ob-dot ${i === idx ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}
