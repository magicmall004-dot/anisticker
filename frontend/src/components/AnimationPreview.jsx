import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import pako from "pako";

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
export default function AnimationPreview({ url, fileType, size = "100%", autoplay = false, loop = true, play = false }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);
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
          // Fetch binary and decompress with pako
          const res  = await fetch(url);
          const buf  = await res.arrayBuffer();
          const json = pako.inflate(new Uint8Array(buf), { to: "string" });
          animData   = JSON.parse(json);
        } else {
          const res = await fetch(url);
          animData  = await res.json();
        }

        if (destroyed) return;

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
  }, [url, fileType]);

  // External play trigger
  useEffect(() => {
    if (play && animRef.current) {
      animRef.current.goToAndPlay(0);
    }
  }, [play]);

  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      {loading && (
        <div style={{ inset:0, position:"absolute", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div className="spinner" style={{ width:20, height:20, borderWidth:2 }} />
        </div>
      )}
      {error && (
        <div style={{ inset:0, position:"absolute", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
          🎞
        </div>
      )}
      <div ref={containerRef} style={{ width:"100%", height:"100%", opacity: loading||error ? 0:1 }} />
    </div>
  );
}
