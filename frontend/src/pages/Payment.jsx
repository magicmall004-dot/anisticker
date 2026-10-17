import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Wallet, AlertCircle, Plus } from "lucide-react";
import { createOrder, getMyBalance, getMyVouchers } from "../lib/api";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../lib/utils";
import {
  showBackButton, hideBackButton,
  showMainButton, hideMainButton, setMainButtonLoading,
  hapticNotification, showConfirm
} from "../lib/telegram";
import AnimatedNumber from "../components/AnimatedNumber";

export default function Payment() {
  const { cart, cartTotal, user, clearCart } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const setupData = location.state || {};

  const [balance,    setBalance]    = useState(null);
  const [placing,    setPlacing]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [cats,       setCats]       = useState([]);
  const [voucherIds, setVoucherIds] = useState(new Set());

  useEffect(() => {
    showBackButton(() => navigate(-1));
    getMyBalance().then((b) => setBalance(b.balance)).finally(() => setLoading(false));
    import("../lib/api").then(({ getCategories, getMyVouchers }) => {
      getCategories().then(setCats).catch(() => {});
      getMyVouchers().then(vs => setVoucherIds(new Set(vs.map(v => v.design_id)))).catch(() => {});
    });
    return () => { hideBackButton(); hideMainButton(); };
  }, []);


  const total = cartTotal(user?.role, cats, voucherIds);
  const canPlace = cart.length > 0 && balance !== null && balance >= total && !placing;
  const insufficient = balance !== null && balance < total;

  useEffect(() => {
    if (canPlace) {
      showMainButton(`Pay with Balance · ${formatPrice(total)}`, placeOrder, "#04D9FF", "#000000");
    } else {
      hideMainButton();
    }
  }, [canPlace, total]);

  if (cart.length === 0) { navigate("/"); return null; }

  async function placeOrder() {
    const confirmed = await showConfirm(
      `Confirm order for ${cart.length} design${cart.length>1?"s":""}\nTotal: ${formatPrice(total)}\n\nThis will be deducted from your wallet balance.`
    );
    if (!confirmed) return;

    setPlacing(true);
    setMainButtonLoading(true);
    try {
      const order = await createOrder({
        items: cart.map((i) => ({
          design_id:       i.design.id,
          primary_color:   i.primaryColor   || setupData.primaryColor,
          secondary_color: i.secondaryColor || setupData.secondaryColor,
          extra_colors:    i.extraColors    || [],
          custom_text:     i.customText     || null,
          text_values:     i.textValues     || [],
          is_instant:      i.design.is_instant || false,
          instant_svg:     (i.logoMode === "text" ? null : i.instantSvg) || null,
          instant_text:    (i.logoMode === "text" ? i.instantText : null) || null,
          instant_colors:  i.instantColors  || {},
          logo_slots:      i.design.logo_slots || [],
          color_map:       i.design.color_map  || [],
        })),
        payment_method_id:     null,
        transaction_image_url: null,
        total_price:           total,
        logo_type:    setupData.logoMode    || null,
        logo_name:    setupData.logoName    || null,
        logo_symbol:  setupData.logoSymbol  || null,
        logo_file_url: setupData.logoUrl   || null,
        add_username:  setupData.addUsername || false,
        tg_username:   setupData.tgUsername  || null,
        primary_color:   setupData.primaryColor   || null,
        secondary_color: setupData.secondaryColor || null,
      });
      hapticNotification("success");
      clearCart();
      navigate("/order-confirm", { state: { order } });
    } catch (e) {
      hapticNotification("error");
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d => d.msg||JSON.stringify(d)).join(", ") : (detail || e.message);
      alert("Failed: " + msg);
    } finally {
      setPlacing(false);
      setMainButtonLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">Payment</div>
      </div>

      <div className="page-body pay-auto">
        {/* Order summary */}
        <div className="card-glow">
          <div className="row-between">
            <div style={{ color:"var(--hint)", fontSize:13 }}>Designs selected</div>
            <div style={{ fontWeight:700 }}>{cart.length}</div>
          </div>
          {cart.every(i => i.design.is_instant) && (
            <div style={{ marginTop:8,padding:"6px 10px",borderRadius:8,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",fontSize:12,color:"var(--success)",textAlign:"center" }}>
              ⚡ Instant Design — Auto-delivered immediately after payment!
            </div>
          )}
          <div className="divider" style={{ margin:"8px 0" }}/>
          <div className="row-between">
            <div style={{ fontWeight:700, fontSize:16 }}>Total</div>
            <div style={{ fontWeight:800, fontSize:20 }} className="glow-text">
              <AnimatedNumber value={total} format={formatPrice} />
            </div>
          </div>
        </div>

        {/* Wallet balance */}
        <div className="section-title">Wallet Balance</div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:24 }}><div className="spinner"/></div>
        ) : (
          <div className={`card ${insufficient ? "pay-short" : ""}`} style={{ border: insufficient ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(var(--accent-rgb),0.2)" }}>
            <div className="row-between">
              <div className="row" style={{ gap:10 }}>
                <Wallet size={22} color={insufficient ? "var(--danger)" : "var(--accent)"} />
                <div>
                  <div style={{ fontSize:11, color:"var(--hint)" }}>Available Balance</div>
                  <div style={{ fontSize:20, fontWeight:800, color: insufficient ? "var(--danger)" : "var(--text)" }}>
                    <AnimatedNumber value={balance||0} format={formatPrice} />
                  </div>
                </div>
              </div>
            </div>

            {insufficient && (
              <>
                <div className="divider" style={{ margin:"12px 0" }}/>
                <div className="row" style={{ gap:8, color:"var(--danger)", fontSize:13, marginBottom:12 }}>
                  <AlertCircle size={16} />
                  <span>You need {formatPrice(total - balance)} more to place this order.</span>
                </div>
                <button className="btn btn-primary btn-full" onClick={() => navigate("/wallet")}>
                  <Plus size={16} /> Top Up Balance
                </button>
              </>
            )}
          </div>
        )}

        {/* Fallback button - only show if no Telegram MainButton support */}
        {canPlace && !window.Telegram?.WebApp && (
          <button className="btn btn-primary btn-full" disabled={placing} onClick={placeOrder} style={{ padding:16 }}>
            {placing ? "Placing Order…" : `Pay with Balance · ${formatPrice(total)}`}
          </button>
        )}
      </div>
    </div>
  );
}
