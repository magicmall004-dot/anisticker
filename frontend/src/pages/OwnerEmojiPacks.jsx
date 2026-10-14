import { useState, useEffect } from "react";
import { getEmojiPacks } from "../lib/api";
import { ExternalLink, Sparkles } from "lucide-react";
import { openTelegramLink } from "../lib/telegram";

export default function OwnerEmojiPacks() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setPacks(await getEmojiPacks()); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 4 }}>Emoji Packs</h3>
      <div style={{ fontSize: 12, color: "var(--hint)", marginBottom: 14 }}>
        Each category gets its own set of packs, capped at 200 designs per pack.
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <div className="spinner" />
        </div>
      ) : packs.length === 0 ? (
        <div style={{ color: "var(--hint)", fontSize: 13 }}>No emoji packs yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {packs.map((p) => (
            <div
              key={p.id}
              onClick={() => openTelegramLink(p.telegram_link)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12,
                background: "var(--card)", border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={16} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "var(--hint)", marginTop: 2 }}>
                  {p.sticker_count}/200 stickers
                  {!p.is_current && <span style={{ marginLeft: 6 }}>· Full</span>}
                </div>
              </div>
              <ExternalLink size={16} color="var(--hint)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
