// Same thresholds as the server and the Profile page
export const TIERS = [
  { key: "bronze",   name: "Bronze",   min: 0,      color: "#CD7F32" },
  { key: "silver",   name: "Silver",   min: 100000, color: "#C0C0C0" },
  { key: "gold",     name: "Gold",     min: 300000, color: "#FFD700" },
  { key: "platinum", name: "Platinum", min: 600000, color: "#7FE0FF" },
];
export function tierFor(spent) {
  const s = Number(spent) || 0;
  let cur = TIERS[0];
  for (const t of TIERS) if (s >= t.min) cur = t;
  return cur;
}
