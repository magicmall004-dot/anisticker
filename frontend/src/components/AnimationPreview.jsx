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

        let animData;

        if (fileType === "tgs") {
          // Fetch binary and decompress with pako, stopping cleanly at the
          // end of the first gzip member so trailing garbage bytes (seen in
          // some exported/re-saved .tgs files) don't break decompression.
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          let json;
          try {
            const inflator = new pako.Inflate({ to: "string" });
            let chunks = "";
            inflator.onData = (chunk) => { chunks += chunk; };
            inflator.push(new Uint8Array(buf), true);
            if (inflator.err && !chunks) throw new Error(inflator.msg || "inflate failed");
            json = chunks;
          } catch (streamErr) {
            // Fallback to the simple one-shot path for normal files
            json = pako.inflate(new Uint8Array(buf), { to: "string" });
          }
          animData = JSON.parse(json);
        } else {
          const res = await fetch(url);
          animData  = await res.json();
        }

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
          renderer:     "svg",
          loop,
          autoplay,
          animationData: animData,
          rendererSettings: { preserveAspectRatio: `xMidYMid ${fit}` },
        });

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

  // External play trigger
  useEffect(() => {
    if (play && animRef.current) {
      animRef.current.goToAndPlay(0);
    }
  }, [play]);

  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0, overflow: "hidden" }}>
      {error && (
        <div ref={fallbackRef} style={{ inset:0, position:"absolute", width:"100%", height:"100%" }} />
      )}
      <div ref={containerRef} style={{ width:"100%", height:"100%", opacity: loading||error ? 0:1 }} />
    </div>
  );
}
