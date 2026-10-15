import AnimationPreview from "./AnimationPreview";

const LOGO_URL = "https://njnvplfaevaudhcjayyz.supabase.co/storage/v1/object/public/designs/logo.json";

// Pull-to-refresh indicator: your logo inside a progress ring
export default function BrandPull({ progress = 0 }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className={`bp ${p >= 1 ? "bp-ready" : ""}`}
      style={{ "--p": p, opacity: 0.25 + p * 0.75, transform: `scale(${0.6 + p * 0.4})` }}>
      <div className="bp-ring" />
      <div className="bp-logo"><AnimationPreview url={LOGO_URL} fileType="json" size="26px" autoplay loop /></div>
    </div>
  );
}
