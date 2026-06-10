import { ShoppingBag } from "lucide-react";
import { formatPrice } from "../lib/utils";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { haptic } from "../lib/telegram";

export default function CartBar() {
  const { cart, cartTotal, user } = useApp();
  const navigate = useNavigate();

  if (cart.length === 0) return null;

  const total = cartTotal(user?.role);

  return (
    <div
      className="cart-bar"
      onClick={() => { haptic("medium"); navigate("/setup"); }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{
          background:"rgba(255,255,255,.2)", borderRadius:99,
          padding:"2px 10px", fontWeight:700, fontSize:14,
        }}>
          {cart.length}
        </div>
        <span style={{ fontWeight:600 }}>
          {cart.length === 1 ? "1 design selected" : `${cart.length} designs selected`}
        </span>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontWeight:700 }}>{formatPrice(total)}</span>
        <ShoppingBag size={18} />
      </div>
    </div>
  );
}
