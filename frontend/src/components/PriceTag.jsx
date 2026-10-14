import { formatPrice } from "../lib/utils";

/**
 * Unified price display — handles free (voucher), discounted, and normal pricing
 * with one consistent visual treatment instead of three ad-hoc code paths.
 */
export default function PriceTag({ basePrice, discountAmount = 0, isFree = false }) {
  const strikeStyle = { fontSize: 10, textDecoration: "line-through", color: "var(--hint)" };

  if (isFree) {
    return (
      <div>
        <div style={strikeStyle}>{formatPrice(basePrice)}</div>
        <div className="design-card-price" style={{ color: "#FFD700" }}>FREE 🎁</div>
      </div>
    );
  }
  if (discountAmount > 0) {
    const finalPrice = Math.max(0, basePrice - discountAmount);
    return (
      <div>
        <div style={strikeStyle}>{formatPrice(basePrice)}</div>
        <div className="design-card-price" style={{ color: "var(--success)" }}>{formatPrice(finalPrice)}</div>
      </div>
    );
  }
  return <div className="design-card-price">{formatPrice(basePrice)}</div>;
}
