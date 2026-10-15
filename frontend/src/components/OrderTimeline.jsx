import { useState, useEffect } from "react";
import { Clock, Palette, PartyPopper, XCircle, Check } from "lucide-react";

const STEPS = [
  { id: "pending",  label: "Received",    Icon: Clock,      color: "#f59e0b" },
  { id: "accepted", label: "In progress", Icon: Palette,    color: "#04D9FF" },
  { id: "done",     label: "Delivered",   Icon: PartyPopper, color: "#22c55e" },
];

function ago(dateStr) {
  const m = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OrderTimeline({ order }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const status = order.status;
  if (status === "cancelled") {
    return <div className="ot-cancel"><XCircle size={18} /> Order cancelled</div>;
  }
  const cur = STEPS.findIndex((s) => s.id === status);
  const note =
    status === "pending" ? "Waiting for the owner to accept your order"
    : status === "accepted" ? "Our designer is working on your order"
    : "Delivered! Check your Telegram messages";

  return (
    <div className="ot">
      <div className="ot-track">
        {STEPS.map((s, i) => {
          const complete = status === "done" ? true : i < cur;
          const active = status !== "done" && i === cur;
          const Icon = s.Icon;
          return (
            <div key={s.id} className={`ot-step ${complete ? "complete" : ""} ${active ? "active" : ""}`} style={{ "--c": s.color }}>
              <div className="ot-node">
                {complete ? <Check size={18} strokeWidth={3} /> : <span className="ot-icon"><Icon size={18} /></span>}
              </div>
              <div className="ot-label">{s.label}</div>
            </div>
          );
        })}
      </div>
      {status === "accepted" && <div className="ot-work"><i /></div>}
      <div className="ot-note">{note}</div>
      {status !== "done" && <div className="ot-since">Placed {ago(order.created_at)}</div>}
    </div>
  );
}
