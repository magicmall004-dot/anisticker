// Mouse drag + wheel scrolling for horizontal lists (.scroll-row) on desktop.
// Touch devices are not affected.
let row = null, startX = 0, startLeft = 0, moved = false;

document.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  const r = e.target.closest && e.target.closest(".scroll-row");
  if (!r || r.scrollWidth <= r.clientWidth) return;
  row = r; startX = e.clientX; startLeft = r.scrollLeft; moved = false;
});

document.addEventListener("mousemove", (e) => {
  if (!row) return;
  const dx = e.clientX - startX;
  if (Math.abs(dx) > 4) {
    if (!moved) { moved = true; row.classList.add("dragging"); }
    row.scrollLeft = startLeft - dx;
    e.preventDefault();
  }
});

function end() {
  if (!row) return;
  row.classList.remove("dragging");
  row = null;
  setTimeout(() => { moved = false; }, 0);
}
document.addEventListener("mouseup", end);
document.addEventListener("mouseleave", end);

// After a drag, don't treat the release as a click on a pill
document.addEventListener("click", (e) => {
  if (moved) { e.stopPropagation(); e.preventDefault(); }
}, true);

// Mouse wheel scrolls the row sideways
document.addEventListener("wheel", (e) => {
  const r = e.target.closest && e.target.closest(".scroll-row");
  if (!r || r.scrollWidth <= r.clientWidth) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    r.scrollLeft += e.deltaY;
    e.preventDefault();
  }
}, { passive: false });
