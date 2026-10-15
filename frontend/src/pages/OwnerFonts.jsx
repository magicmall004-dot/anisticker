import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
  getFontSets, createFontSet, deleteFontSet,
  getGlyphs, uploadGlyph, deleteGlyph,
  uploadStartAsset, uploadEndAsset,
} from "../lib/api";

export default function OwnerFonts() {
  const [fontSets, setFontSets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [glyphs, setGlyphs] = useState([]);
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState("en");
  const [charInput, setCharInput] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadFontSets(); }, []);
  useEffect(() => { if (selected) loadGlyphs(selected.id); else setGlyphs([]); }, [selected]);

  async function loadFontSets() {
    const data = await getFontSets();
    setFontSets(data);
  }

  async function loadGlyphs(fontSetId) {
    const data = await getGlyphs(fontSetId);
    setGlyphs(data);
  }

  async function handleCreateFontSet() {
    if (!newName.trim()) return;
    const created = await createFontSet({ name: newName.trim(), language: newLang.trim() || "en" });
    setNewName("");
    await loadFontSets();
    setSelected(created);
  }

  async function handleDeleteFontSet(id) {
    if (!confirm("Delete this font set and all its glyphs?")) return;
    await deleteFontSet(id);
    if (selected?.id === id) setSelected(null);
    await loadFontSets();
  }

  async function handleUploadGlyph(file) {
    if (!selected || !charInput) return;
    setUploading(true);
    try {
      await uploadGlyph(selected.id, charInput, file);
      setCharInput("");
      await loadGlyphs(selected.id);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteGlyph(character) {
    await deleteGlyph(selected.id, character);
    await loadGlyphs(selected.id);
  }

  async function handleUploadStart(file) {
    setUploading(true);
    try {
      await uploadStartAsset(selected.id, file);
      await loadFontSets();
      const updated = (await getFontSets()).find((f) => f.id === selected.id);
      setSelected(updated);
    } finally {
      setUploading(false);
    }
  }

  async function handleUploadEnd(file) {
    setUploading(true);
    try {
      await uploadEndAsset(selected.id, file);
      const updated = (await getFontSets()).find((f) => f.id === selected.id);
      setSelected(updated);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>Font Sets</h3>

      {/* Create new font set */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Font set name (e.g. Myanmar Bold)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          className="input"
          placeholder="lang (e.g. my)"
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
          style={{ width: 80 }}
        />
        <button className="btn btn-primary" onClick={handleCreateFontSet}>+ Create</button>
      </div>

      {/* Font set list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {fontSets.map((fs) => (
          <div
            key={fs.id}
            onClick={() => setSelected(fs)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: 10, cursor: "pointer",
              background: selected?.id === fs.id ? "rgba(var(--accent-rgb),0.12)" : "rgba(255,255,255,0.04)",
              border: selected?.id === fs.id ? "1px solid rgba(var(--accent-rgb),0.4)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{fs.name}</div>
              <div style={{ fontSize: 11, color: "var(--hint)" }}>{fs.language}</div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: 12, color: "#ff5c5c" }}
              onClick={(e) => { e.stopPropagation(); handleDeleteFontSet(fs.id); }}
            >
              Delete
            </button>
          </div>
        ))}
        {fontSets.length === 0 && (
          <div style={{ color: "var(--hint)", fontSize: 13 }}>No font sets yet — create one above.</div>
        )}
      </div>

      {selected && (
        <>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>{selected.name} — Start / End Assets</h4>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--hint)", marginBottom: 6 }}>Start asset (optional)</div>
                {selected.start_asset_url && <div style={{ fontSize: 11, color: "var(--success)", marginBottom: 6 }}><Check size={11} style={{display:"inline",verticalAlign:"-1px"}}/> uploaded</div>}
                <label className="btn btn-secondary btn-full" style={{ cursor: "pointer" }}>
                  {uploading ? "Uploading…" : "Upload Start"}
                  <input type="file" accept=".json,.tgs,.svg" style={{ display: "none" }}
                    onChange={(e) => e.target.files[0] && handleUploadStart(e.target.files[0])} />
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--hint)", marginBottom: 6 }}>End asset (optional)</div>
                {selected.end_asset_url && <div style={{ fontSize: 11, color: "var(--success)", marginBottom: 6 }}><Check size={11} style={{display:"inline",verticalAlign:"-1px"}}/> uploaded</div>}
                <label className="btn btn-secondary btn-full" style={{ cursor: "pointer" }}>
                  {uploading ? "Uploading…" : "Upload End"}
                  <input type="file" accept=".json,.tgs,.svg" style={{ display: "none" }}
                    onChange={(e) => e.target.files[0] && handleUploadEnd(e.target.files[0])} />
                </label>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
            <h4 style={{ marginBottom: 10 }}>Glyphs ({glyphs.length})</h4>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                className="input"
                placeholder="Character (e.g. A or က)"
                value={charInput}
                onChange={(e) => setCharInput(e.target.value.slice(0, 2))}
                style={{ width: 100 }}
              />
              <label className="btn btn-primary" style={{ cursor: "pointer", flex: 1, textAlign: "center" }}>
                {uploading ? "Uploading…" : "+ Upload glyph file"}
                <input type="file" accept=".json,.tgs,.svg" style={{ display: "none" }}
                  onChange={(e) => e.target.files[0] && handleUploadGlyph(e.target.files[0])} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 8 }}>
              {glyphs.map((g) => (
                <div key={g.character} style={{
                  border: "1px solid var(--border)", borderRadius: 10,
                  padding: 8, textAlign: "center", position: "relative",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{g.character}</div>
                  <div style={{ fontSize: 9, color: "var(--hint)", marginTop: 2 }}>{g.file_type}</div>
                  <button
                    onClick={() => handleDeleteGlyph(g.character)}
                    style={{
                      position: "absolute", top: 2, right: 2, width: 16, height: 16,
                      borderRadius: "50%", border: "none", background: "rgba(255,92,92,0.2)",
                      color: "#ff5c5c", fontSize: 10, cursor: "pointer", lineHeight: 1,
                    }}
                  >×</button>
                </div>
              ))}
              {glyphs.length === 0 && (
                <div style={{ gridColumn: "1 / -1", color: "var(--hint)", fontSize: 13 }}>
                  No glyphs uploaded yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
