import { Medal, Award, Trophy, Gem } from "lucide-react";
import AnimationPreview from "./AnimationPreview";
import { useEmojis } from "../context/EmojiContext";
import { useGraphics } from "../context/GraphicsContext";
import { tierFor } from "../lib/tiers";

const ICONS = { bronze: Medal, silver: Award, gold: Trophy, platinum: Gem };
const SHOW_BRONZE = true; // set to false to show badges only for Silver and above

export default function TierBadge({ spent, size = 16, label = false }) {
  const emojis = useEmojis();
  const { effects } = useGraphics();
  const t = tierFor(spent);
  if (t.key === "bronze" && !SHOW_BRONZE) return null;
  const url = emojis["tgs_tier_" + t.key];
  const Icon = ICONS[t.key];
  return (
    <span className="tb" title={`${t.name} tier`} style={{ "--tc": t.color }}>
      {url && effects.badgeAnimatedEmoji
        ? <AnimationPreview url={url} fileType={url.endsWith("tgs") ? "tgs" : "json"} size={`${size}px`} autoplay loop />
        : <Icon size={size - 2} color={t.color} />}
      {label && <span className="tb-name">{t.name}</span>}
    </span>
  );
}
