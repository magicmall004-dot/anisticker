import AnimationPreview from "./AnimationPreview";
import { useEmojis } from "../context/EmojiContext";

export default function Loader({ size = 32 }) {
  const emojis = useEmojis();
  if (emojis.tgs_loading) {
    return (
      <AnimationPreview
        url={emojis.tgs_loading}
        fileType={emojis.tgs_loading.endsWith("tgs") ? "tgs" : "json"}
        size={`${size}px`} autoplay loop
      />
    );
  }
  return (
    <div className="dot-loader-wrap" style={{ width:size*3, height:size }}>
      <div className="dot-loader-circle" />
      <div className="dot-loader-circle" />
      <div className="dot-loader-circle" />
      <div className="dot-loader-shadow" />
      <div className="dot-loader-shadow" />
      <div className="dot-loader-shadow" />
    </div>
  );
}
