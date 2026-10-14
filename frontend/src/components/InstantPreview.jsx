import { useState, useEffect, useRef, useMemo } from "react";

// JS port of the server's color-matching/replacement logic (routes/instant.py)
// so the live preview matches what the order actually produces.
function hexToLottie(hex) {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return [0, 0, 0, 1];
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1];
}
function colorsMatch(c, targetHex, tol = 0.015) {
  const t = hexToLottie(targetHex);
  if (!Array.isArray(c) || c.length < 3) return false;
  return [0, 1, 2].every((i) => Math.abs(c[i] - t[i]) < tol);
}
function replaceColorsInShapes(shapes, colorMapObj) {
  for (const s of shapes || []) {
    const ty = s.ty;
    if (ty === "fl" || ty === "st") {
      const k = s.c?.k;
      if (Array.isArray(k) && k.length >= 3) {
        for (const [oldHex, newHex] of Object.entries(colorMapObj)) {
          if (colorsMatch(k, oldHex)) {
            s.c.k = hexToLottie(newHex);
            break;
          }
        }
      }
    }
    if (ty === "gr" && s.it) replaceColorsInShapes(s.it, colorMapObj);
  }
}
function hasColorRecursive(items, hex) {
  for (const item of items || []) {
    if ((item.ty === "fl" || item.ty === "st") && colorsMatch(item.c?.k, hex)) return true;
    if (item.ty === "gr" && item.it && hasColorRecursive(item.it, hex)) return true;
  }
  return false;
}
function getGroupBounds(items) {
  let allX = [], allY = [];
  for (const s of items || []) {
    if (s.ty === "sh") {
      const k = s.ks?.k;
      if (k && k.v) for (const v of k.v) { allX.push(v[0]); allY.push(v[1]); }
    }
    if (s.ty === "gr" && s.it) {
      const [bx, by] = getGroupBounds(s.it);
      allX = allX.concat(bx); allY = allY.concat(by);
    }
  }
  return [allX, allY];
}
function findLogoBounds(shapes, logoHex) {
  for (const s of shapes || []) {
    if (s.ty === "gr" && s.it) {
      if (hasColorRecursive(s.it, logoHex)) {
        const [bx, by] = getGroupBounds(s.it);
        if (bx.length && by.length) {
          return { minX: Math.min(...bx), maxX: Math.max(...bx), minY: Math.min(...by), maxY: Math.max(...by) };
        }
        return null;
      }
      const inner = findLogoBounds(s.it, logoHex);
      if (inner) return inner;
    }
  }
  return null;
}

/**
 * Live preview for instant designs: accurately re-colors the animation
 * client-side (matching the server's color-swap logic exactly), and
 * overlays the customer's uploaded SVG or entered text positioned over
 * the detected "logo" zone's bounding box. This is an approximation for
 * the logo — it overlays the raw asset rather than baking it into the
 * Lottie vector data the way the server does at order time — but for a
 * static logo placement it looks effectively identical.
 */
export default function InstantPreview({ fileUrl, colorMap = [], instantColors = {}, logoMode, instantSvg, instantText, size = 160 }) {
  const [rawAnim, setRawAnim] = useState(null);
  const ref = useRef();
  const inst = useRef();

  useEffect(() => {
    if (!fileUrl?.endsWith(".tgs")) return;
    (async () => {
      try {
        const r = await fetch(fileUrl);
        const buf = await r.arrayBuffer();
        const pako = (await import("pako")).default;
        setRawAnim(JSON.parse(pako.inflate(new Uint8Array(buf), { to: "string" })));
      } catch (e) { console.error(e); }
    })();
  }, [fileUrl]);

  const processedAnim = useMemo(() => {
    if (!rawAnim) return null;
    const clone = JSON.parse(JSON.stringify(rawAnim));
    if (Object.keys(instantColors).length) {
      for (const layer of clone.layers || []) if (layer.shapes) replaceColorsInShapes(layer.shapes, instantColors);
      for (const asset of clone.assets || []) for (const layer of asset.layers || []) if (layer.shapes) replaceColorsInShapes(layer.shapes, instantColors);
    }
    return clone;
  }, [rawAnim, instantColors]);

  const logoBounds = useMemo(() => {
    if (!rawAnim) return null;
    const logoSlot = colorMap.find((c) => c.role === "logo");
    if (!logoSlot) return null;
    for (const layer of rawAnim.layers || []) {
      if (layer.shapes) {
        const b = findLogoBounds(layer.shapes, logoSlot.original);
        if (b) return b;
      }
    }
    for (const asset of rawAnim.assets || []) {
      for (const layer of asset.layers || []) {
        if (layer.shapes) {
          const b = findLogoBounds(layer.shapes, logoSlot.original);
          if (b) return b;
        }
      }
    }
    return null;
  }, [rawAnim, colorMap]);

  useEffect(() => {
    if (!ref.current || !processedAnim) return;
    ref.current.innerHTML = "";
    import("lottie-web").then(({ default: lottie }) => {
      try { inst.current?.destroy(); } catch (e) {}
      inst.current = lottie.loadAnimation({
        container: ref.current, renderer: "svg", loop: true, autoplay: true, animationData: processedAnim,
      });
    });
    return () => { try { inst.current?.destroy(); } catch (e) {} };
  }, [processedAnim]);

  if (!fileUrl?.endsWith(".tgs")) return null;

  const w = rawAnim?.w || 512;
  let overlayStyle = null;
  if (logoBounds) {
    const bw = logoBounds.maxX - logoBounds.minX;
    const bh = logoBounds.maxY - logoBounds.minY;
    const cx = (logoBounds.minX + logoBounds.maxX) / 2;
    const cy = (logoBounds.minY + logoBounds.maxY) / 2;
    const pxPerUnit = size / w;
    overlayStyle = {
      position: "absolute",
      left: (cx - bw / 2) * pxPerUnit,
      top: (cy - bh / 2) * pxPerUnit,
      width: Math.max(bw * pxPerUnit, 4),
      height: Math.max(bh * pxPerUnit, 4),
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "none",
    };
  }

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      {overlayStyle && logoMode === "svg" && instantSvg && (
        <div style={overlayStyle} dangerouslySetInnerHTML={{ __html: instantSvg }} />
      )}
      {overlayStyle && logoMode === "text" && instantText && (
        <div style={{ ...overlayStyle, fontWeight: 800, fontSize: Math.max((overlayStyle.height || 20) * 0.4, 8), color: "#fff", textAlign: "center", overflow: "hidden", whiteSpace: "nowrap" }}>
          {instantText}
        </div>
      )}
    </div>
  );
}
