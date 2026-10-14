// Mouse drag + wheel scrolling for ANY horizontally scrollable element (desktop).
// Touch devices are not affected.
let el = null, startX = 0, startLeft = 0, moved = false;

function findScroller(node) {
  while (node && node !== document.body && node.nodeType === 1) {
    const ox = getComputedStyle(node).overflowX;
    if ((ox === "auto" || ox === "scroll") && node.scrollWidth > node.clientWidth + 1) return node;
    node = node.parentElement;
  }
  return null;
}

document.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
  const s = findScroller(e.target);
  if (!s) return;
  el = s; startX = e.clientX; startLeft = s.scrollLeft; moved = false;
});

document.addEventListener("mousemove", (e) => {
  if (!el) return;
  const dx = e.clientX - startX;
  if (Math.abs(dx) > 4) {
    if (!moved) { moved = true; el.classList.add("drag-active"); }
    el.scrollLeft = startLeft - dx;
    e.preventDefault();
  }
});

function end() {
  if (!el) return;
  el.classList.remove("drag-active");
  el = null;
  setTimeout(() => { moved = false; }, 0);
}
document.addEventListener("mouseup", end);
document.addEventListener("mouseleave", end);

// After a drag, ignore the click so a button isn't pressed by accident
document.addEventListener("click", (e) => {
  if (moved) { e.stopPropagation(); e.preventDefault(); }
}, true);

// Mouse wheel scrolls sideways, only when the element can't scroll vertically
document.addEventListener("wheel", (e) => {
  if (e.ctrlKey) return;
  const s = findScroller(e.target);
  if (!s || s.scrollHeight > s.clientHeight + 1) return;
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const before = s.scrollLeft;
  s.scrollLeft += d;
  if (s.scrollLeft !== before) e.preventDefault();
}, { passive: false });
