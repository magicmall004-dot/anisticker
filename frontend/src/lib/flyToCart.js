// Fly-to-cart effect: a copy of the tapped design flies into the cart bar.
// Runs before React's own click handler, so the card is not "selected" yet
// when it is being added. No React code is touched.
document.addEventListener("click", (e) => {
  try {
    const root = document.documentElement;
    if (root.dataset.gfx === "low") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("button")) return;                     // heart / expand buttons
    const card = t.closest(".design-card");
    if (!card || card.classList.contains("skeleton-card")) return;
    if (card.classList.contains("selected") || card.classList.contains("selected-simple")) return; // removing, not adding

    const src = card.querySelector(".design-card-anim");
    if (!src) return;
    const a = src.getBoundingClientRect();
    if (!a.width) return;

    const bar = document.querySelector(".cart-bar");
    const b = bar ? bar.getBoundingClientRect() : null;
    const size = 56;
    const sx = a.left + a.width / 2 - size / 2;
    const sy = a.top + a.height / 2 - size / 2;
    const tx = (b ? b.left + 36 : window.innerWidth / 2) - size / 2;
    const ty = (b ? b.top + b.height / 2 : window.innerHeight - 120) - size / 2;

    const fly = document.createElement("div");
    fly.style.cssText =
      `position:fixed;left:0;top:0;width:${size}px;height:${size}px;z-index:9999;pointer-events:none;` +
      "border-radius:14px;overflow:hidden;background:rgba(10,10,15,0.85);" +
      "border:1.5px solid rgba(4,217,255,0.7);box-shadow:0 0 22px rgba(4,217,255,0.6);will-change:transform,opacity;";
    const svg = src.querySelector("svg");
    if (svg) {
      const c = svg.cloneNode(true);
      c.style.width = "100%"; c.style.height = "100%";
      fly.appendChild(c);
    }
    const cv = src.querySelector("canvas");
    if (!svg && cv) {
      const c2 = document.createElement("canvas");
      c2.width = cv.width; c2.height = cv.height; c2.style.cssText = "width:100%;height:100%";
      c2.getContext("2d").drawImage(cv, 0, 0);
      fly.appendChild(c2);
    }
    document.body.appendChild(fly);

    const midX = (sx + tx) / 2;
    const midY = Math.min(sy, ty) - 70;                  // arc upward
    const anim = fly.animate([
      { transform: `translate(${sx}px,${sy}px) scale(1)`, opacity: 1, offset: 0 },
      { transform: `translate(${midX}px,${midY}px) scale(0.85)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${tx}px,${ty}px) scale(0.25)`, opacity: 0.2, offset: 1 },
    ], { duration: 620, easing: "cubic-bezier(0.4,0,0.2,1)" });

    anim.onfinish = () => {
      fly.remove();
      const cb = document.querySelector(".cart-bar");
      if (cb) cb.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
        { duration: 380, easing: "cubic-bezier(0.34,1.56,0.64,1)" }
      );
    };
  } catch (err) { /* never break a tap */ }
}, true);
