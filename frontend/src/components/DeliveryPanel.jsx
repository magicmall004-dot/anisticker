import { useState } from "react";
import { Send, Package, CheckCircle } from "lucide-react";
import { hapticNotification, haptic, showAlert } from "../lib/telegram";
import api from "../lib/api";

export default function DeliveryPanel({ order, onDelivered }) {
  const [started,  setStarted]  = useState(false);
  const [sending,  setSending]  = useState(false);

  async function startDelivery() {
    setSending(true);
    haptic("medium");
    try {
      await api.post(`/delivery/orders/${order.id}/start`);
      setStarted(true);
      hapticNotification("success");
    } catch (e) {
      hapticNotification("error");
      await showAlert("Failed: " + (e.response?.data?.detail || e.message));
    } finally { setSending(false); }
  }

  if (started) {
    return (
      <div style={{ padding:"16px", background:"rgba(var(--accent-rgb),0.05)", borderRadius:"var(--radius)", border:"1px solid rgba(var(--accent-rgb),0.2)" }}>
        <div style={{ fontWeight:700, marginBottom:8, fontSize:15 }}><Package size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Delivery Started!</div>
        <div style={{ fontSize:13, color:"var(--hint)", lineHeight:1.7 }}>
          1. Open your Telegram bot chat<br/>
          2. Tap <b style={{ color:"var(--accent)" }}>Start Delivery</b> button<br/>
          3. Send files one by one (any format supported)<br/>
          4. Send <b style={{ color:"var(--accent)" }}>/done</b> when finished<br/>
          5. Bot auto-delivers + marks order done
        </div>
        <div style={{ marginTop:8, fontSize:12, color:"var(--success)" }}><CheckCircle size={12} style={{display:"inline",verticalAlign:"-2px"}}/> No files stored — sent directly to customer!</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div className="section-title"><Package size={14} style={{display:"inline",verticalAlign:"-2px"}}/> Deliver Order</div>
      <div className="card" style={{ fontSize:13, color:"var(--hint)", lineHeight:1.7 }}>
        Send files directly to customer via bot. Any format supported — .tgs, stickers, images, documents, custom emoji.
      </div>
      <button className="btn btn-primary btn-full" disabled={sending} onClick={startDelivery} style={{ padding:14 }}>
        {sending ? "Starting…" : <><Send size={16} /> Deliver via Bot</>}
      </button>
    </div>
  );
}
