import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Upload, CheckCircle } from "lucide-react";
import { getPaymentMethods, createOrder, uploadTransaction } from "../lib/api";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../lib/utils";
import { showBackButton, hideBackButton, hapticNotification } from "../lib/telegram";

export default function Payment() {
  const { cart, cartTotal, user, clearCart } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const setupData = location.state || {};

  const [methods,   setMethods]   = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [txImage,   setTxImage]   = useState(null);   // URL after upload
  const [txFile,    setTxFile]    = useState(null);   // display name
  const [uploading, setUploading] = useState(false);
  const [placing,   setPlacing]   = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    showBackButton(() => navigate(-1));
    getPaymentMethods().then(setMethods);
    return hideBackButton;
  }, []);

  if (cart.length === 0) { navigate("/"); return null; }

  const total = cartTotal(user?.role);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadTransaction(file);
      setTxImage(res.url);
      setTxFile(file.name);
    } finally {
      setUploading(false);
    }
  }

  async function placeOrder() {
    if (!selected || !txImage) return;
    setPlacing(true);
    try {
      const order = await createOrder({
        items: cart.map((i) => ({
          design_id:       i.design.id,
          primary_color:   i.primaryColor   || setupData.primaryColor,
          secondary_color: i.secondaryColor || setupData.secondaryColor,
          extra_colors:    i.extraColors    || [],
          custom_text:     i.customText     || null,
        })),
        payment_method_id:     selected.id,
        transaction_image_url: txImage,
        total_price:           total,

        logo_type:   setupData.logoMode,
        logo_name:   setupData.logoName   || null,
        logo_symbol: setupData.logoSymbol || null,
        logo_file_url: setupData.logoUrl  || null,

        add_username: setupData.addUsername || false,
        tg_username:  setupData.tgUsername  || null,
        primary_color:   setupData.primaryColor,
        secondary_color: setupData.secondaryColor,
      });

      hapticNotification("success");
      clearCart();
      navigate("/order-confirm", { state: { order } });
    } catch (e) {
      alert("Failed to place order: " + (e.response?.data?.detail || e.message));
    } finally {
      setPlacing(false);
    }
  }

  const canPlace = selected && txImage && !placing && !uploading;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" style={{ padding:6 }} onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="page-title">Payment</div>
      </div>

      <div className="page-body">

        {/* Order summary */}
        <div className="card" style={{ background:"rgba(124,58,237,.12)", border:"1px solid rgba(124,58,237,.25)" }}>
          <div className="row-between">
            <div style={{ color:"var(--hint)", fontSize:13 }}>Designs</div>
            <div style={{ fontWeight:600 }}>{cart.length}</div>
          </div>
          <div className="divider" style={{ margin:"8px 0" }} />
          <div className="row-between">
            <div style={{ fontWeight:700 }}>Total</div>
            <div style={{ fontWeight:700, fontSize:18, color:"var(--accent2)" }}>{formatPrice(total)}</div>
          </div>
        </div>

        {/* Payment method selection */}
        <div className="section-title">Choose Payment Method</div>

        {methods.length === 0 ? (
          <div className="card" style={{ color:"var(--hint)", textAlign:"center", padding:"24px 16px" }}>
            No payment methods available yet
          </div>
        ) : (
          methods.map((m) => (
            <div
              key={m.id}
              className="card"
              onClick={() => setSelected(m)}
              style={{
                cursor:"pointer",
                border:`2px solid ${selected?.id === m.id ? "var(--btn)" : "rgba(255,255,255,0.05)"}`,
                transition:"border-color .15s",
              }}
            >
              <div className="row-between">
                <div className="row" style={{ gap:12 }}>
                  {m.logo_url && (
                    <img src={m.logo_url} alt={m.name}
                      style={{ width:40, height:40, objectFit:"contain", borderRadius:8 }} />
                  )}
                  <div>
                    <div style={{ fontWeight:600 }}>{m.name}</div>
                    {m.account_name && (
                      <div style={{ fontSize:12, color:"var(--hint)" }}>{m.account_name}</div>
                    )}
                    {m.account_number && (
                      <div style={{ fontSize:13, fontFamily:"monospace", fontWeight:600, marginTop:2 }}>
                        {m.account_number}
                      </div>
                    )}
                  </div>
                </div>
                {selected?.id === m.id && (
                  <CheckCircle size={22} color="var(--btn)" />
                )}
              </div>
            </div>
          ))
        )}

        {/* Upload transaction */}
        <div className="section-title">Upload Payment Screenshot</div>

        <input ref={fileRef} type="file" accept="image/*"
          style={{ display:"none" }} onChange={handleFileChange} />

        {!txImage ? (
          <button
            className="btn btn-secondary btn-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{ padding:"20px 16px", flexDirection:"column", gap:8 }}
          >
            <Upload size={24} />
            <span>{uploading ? "Uploading…" : "Tap to upload transaction screenshot"}</span>
          </button>
        ) : (
          <div className="card">
            <div className="row" style={{ gap:12 }}>
              <img src={txImage} alt="transaction"
                style={{ width:64, height:64, objectFit:"cover", borderRadius:8 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{txFile}</div>
                <div style={{ fontSize:12, color:"var(--success)", marginTop:2 }}>✓ Uploaded</div>
                <button className="btn btn-ghost" style={{ padding:"4px 0", fontSize:12 }}
                  onClick={() => fileRef.current?.click()}>
                  Change screenshot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Place order */}
        <button
          className="btn btn-primary btn-full"
          disabled={!canPlace}
          onClick={placeOrder}
          style={{ marginTop:8, padding:"16px" }}
        >
          {placing ? "Placing Order…" : "Confirm Order →"}
        </button>

      </div>
    </div>
  );
}
