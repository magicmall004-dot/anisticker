import AnimationPreview from "./AnimationPreview";
import { useEmojis } from "../context/EmojiContext";
import { useGraphics } from "../context/GraphicsContext";

// Owner / reseller badge: your uploaded animation, or the emoji if none is set
export default function RoleBadge({ role, size = 16 }) {
  const emojis = useEmojis();
  const { effects } = useGraphics();
  if (role !== "owner" && role !== "reseller") return null;
  const url = role === "owner" ? emojis.tgs_owner_badge : emojis.tgs_reseller_badge;
  const fallback = role === "owner" ? "👑" : "⭐";
  return (
    <span className="rb" title={role}>
      {url && effects.badgeAnimatedEmoji
        ? <AnimationPreview url={url} fileType={url.endsWith("tgs") ? "tgs" : "json"} size={`${size}px`} autoplay loop />
        : fallback}
    </span>
  );
}
