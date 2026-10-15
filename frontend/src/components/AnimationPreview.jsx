import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import pako from "pako";

function hexToLottieColor(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0,2), 16) / 255;
  const g = parseInt(h.substring(2,4), 16) / 255;
  const b = parseInt(h.substring(4,6), 16) / 255;
  return [r, g, b, 1];
}

function tintLottieColors(node, rgba) {
  if (Array.isArray(node)) {
    node.forEach(item => tintLottieColors(item, rgba));
    return;
  }
  if (node && typeof node === "object") {
    if ((node.ty === "fl" || node.ty === "st") && node.c && node.c.k) {
      if (Array.isArray(node.c.k) && typeof node.c.k[0] === "number") {
        node.c.k = [...rgba];
      }
    }
    for (const key in node) {
      if (key !== "c") tintLottieColors(node[key], rgba);
    }
  }
}

const RAW_CACHE = new Map();
function loadRaw(url, fileType) {
  if (!RAW_CACHE.has(url)) {
    if (RAW_CACHE.size >= 60) RAW_CACHE.delete(RAW_CACHE.keys().next().value);
    const p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      if (fileType === "tgs") {
        const buf = new Uint8Array(await res.arrayBuffer());
        try {
          const inflator = new pako.Inflate({ to: "string" });
          let chunks = "";
          inflator.onData = (c) => { chunks += c; };
          inflator.push(buf, true);
          if (inflator.err && !chunks) throw new Error("inflate failed");
          return chunks;
        } catch (e) {
          return pako.inflate(buf, { to: "string" });
        }
      }
      return await res.text();
    })();
    p.catch(() => RAW_CACHE.delete(url));
    RAW_CACHE.set(url, p);
  }
  return RAW_CACHE.get(url);
}

const FALLBACK_URL = "https://raw.githubusercontent.com/magicmall004-dot/anisticker/refs/heads/main/CAN_NOT_LOAD.json";

/**
 * Renders a Lottie / TGS animation from a URL.
 * TGS files are gzip-compressed JSON; we decompress them with pako.
 *
 * Props:
 *  url       – Supabase storage URL to a .json or .tgs file
 *  fileType  – "json" | "tgs"
 *  size      – CSS size string, default "100%"
 *  autoplay  – boolean, default false
 *  loop      – boolean, default true
 *  play      – boolean prop to trigger play externally
 */
export default function AnimationPreview({ url, fileType, size = "100%", autoplay = false, loop = true, play = false, fit = "slice", tintColor = null }) {
  const containerRef = useRef(null);
  const fallbackRef = useRef(null);
  const animRef = useRef(null);
  const playRef = useRef(play);
  playRef.current = play;
  const wrapRef = useRef(null);
  const fallbackAnimRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    let destroyed = false;

    (async () => {
      try {
        setLoading(true);
        setError(false);

        const raw = await loadRaw(url, fileType);
        const animData = JSON.parse(raw);

        if (destroyed) return;

        if (tintColor) {
          try { tintLottieColors(animData, hexToLottieColor(tintColor)); } catch (e) { console.error("tint failed", e); }
        }

        // Destroy existing instance
        if (animRef.current) {
          animRef.current.destroy();
          animRef.current = null;
        }

        animRef.current = lottie.loadAnimation({
          container:    containerRef.current,
          renderer:     !autoplay ? "canvas" : "svg",
          loop,
          autoplay,
          animationData: animData,
          rendererSettings: !autoplay
            ? { preserveAspectRatio: `xMidYMid ${fit}`, clearCanvas: true, progressiveLoad: true }
            : { preserveAspectRatio: `xMidYMid ${fit}`, progressiveLoad: true },
        });
        if (!autoplay) {
          const a = animRef.current;
          // tapped before it finished loading: play now; otherwise show a poster frame
          if (playRef.current) a.goToAndPlay(0);
          else { try { a.goToAndStop(Math.floor(a.totalFrames * 0.4), true); } catch (e) {} }
        }

        setLoading(false);
      } catch (e) {
        if (!destroyed) { setError(true); setLoading(false); }
      }
    })();

    return () => {
      destroyed = true;
      if (animRef.current) { animRef.current.destroy(); animRef.current = null; }
    };
  }, [url, fileType, tintColor]);

  // Load fallback animation when the main one errors out.
  // Loaded directly (not via a nested AnimationPreview) so it can't recursively fail.
  useEffect(() => {
    if (!error || !fallbackRef.current) return;

    let destroyed = false;

    (async () => {
      try {
        const res = await fetch(`${FALLBACK_URL}?v=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Fallback fetch failed: ${res.status}`);
        const animData = await res.json();
        if (destroyed) return;

        if (fallbackAnimRef.current) {
          fallbackAnimRef.current.destroy();
          fallbackAnimRef.current = null;
        }

        fallbackAnimRef.current = lottie.loadAnimation({
          container: fallbackRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animData,
          rendererSettings: { preserveAspectRatio: `xMidYMid ${fit}` },
        });
      } catch (e) {
        console.error("Fallback animation failed to load:", e);
      }
    })();

    return () => {
      destroyed = true;
      if (fallbackAnimRef.current) { fallbackAnimRef.current.destroy(); fallbackAnimRef.current = null; }
    };
  }, [error]);

  // Pause animations that are off-screen
  useEffect(() => {
    if (!wrapRef.current || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      const a = animRef.current;
      if (!a) return;
      if (e.isIntersecting) { if (autoplay) a.play(); } else a.pause();
    }, { rootMargin: "120px" });
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [autoplay]);

  // External play trigger
  useEffect(() => {
    if (play && animRef.current) {
      animRef.current.goToAndPlay(0);
    }
  }, [play]);

  return (
    <div ref={wrapRef} style={{ width: size, height: size, position: "relative", flexShrink: 0, overflow: "hidden" }}>
      {error && (
        <div ref={fallbackRef} style={{ inset:0, position:"absolute", width:"100%", height:"100%" }} />
      )}
      <div ref={containerRef} style={{ width:"100%", height:"100%", opacity: loading||error ? 0:1 }} />
    </div>
  );
}
