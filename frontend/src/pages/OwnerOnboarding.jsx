import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { getAppSettings, updateAppSettings, uploadDesignFile } from "../lib/api";
import { hapticNotification, haptic } from "../lib/telegram";
import AnimationPreview from "../components/AnimationPreview";

export default function OwnerOnboarding() {
  const [pages,   setPages]   = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    getAppSettings().then((s) => {
      try { setPages(JSON.parse(s.onboarding_pages||"[]")); } catch { setPages([]); }
      setEnabled(s.onboarding_enabled==="true");
    }).finally(() => setLoading(false));
  }, []);

  function addPage() { setPages((p) => [...p, { tgs_url:"", title:"", description:"" }]); haptic("light"); }
  function updatePage(idx, patch) { setPages((p) => p.map((pg,i) => i===idx?{...pg,...patch}:pg)); }
  function removePage(idx) { setPages((p) => p.filter((_,i) => i!==idx)); haptic("light"); }
  function movePage(idx, dir) {
    setPages((p) => {
      const arr=[...p], ni=idx+dir;
      if(ni<0||ni>=arr.length) return arr;
      [arr[idx],arr[ni]]=[arr[ni],arr[idx]];
      return arr;
    });
  }

  async function handleUpload(idx, file) {
    setUploadingIdx(idx);
    try { const res=await uploadDesignFile(file); updatePage(idx,{tgs_url:res.url}); }
    catch (e) { alert("Upload failed"); }
    finally { setUploadingIdx(null); }
  }

  async function save() {
    setSaving(true);
    try {
      await updateAppSettings({ onboarding_pages:JSON.stringify(pages), onboarding_enabled:enabled?"true":"false" });
      hapticNotification("success");
    } catch (e) { alert("Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ display:"flex",justifyContent:"center",padding:40 }}><div className="spinner"/></div>;

  return (
    <div className="page-body">
      <div className="card-glow">
        <div className="row-between">
          <div>
            <div style={{ fontWeight:700 }}>Welcome Pages</div>
            <div style={{ fontSize:12,color:"var(--hint)" }}>Shown once to new users before the app</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}/>
            <div className="toggle-track"/><div className="toggle-thumb"/>
          </label>
        </div>
      </div>

      {pages.map((page,idx) => (
        <div key={idx} className="card">
          <div className="row-between" style={{ marginBottom:10 }}>
            <span style={{ fontWeight:700,fontSize:13 }}>Page {idx+1}</span>
            <div className="row" style={{ gap:4 }}>
              <button className="btn btn-ghost" style={{ padding:4 }} disabled={idx===0} onClick={() => movePage(idx,-1)}><ChevronUp size={14}/></button>
              <button className="btn btn-ghost" style={{ padding:4 }} disabled={idx===pages.length-1} onClick={() => movePage(idx,1)}><ChevronDown size={14}/></button>
              <button className="btn btn-ghost" style={{ padding:4,color:"var(--danger)" }} onClick={() => removePage(idx)}><Trash2 size={14}/></button>
            </div>
          </div>
          <div className="row" style={{ gap:10,marginBottom:10 }}>
            <div style={{ width:56,height:56,borderRadius:10,flexShrink:0,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
              {page.tgs_url ? <AnimationPreview url={page.tgs_url} fileType={page.tgs_url.endsWith("tgs")?"tgs":"json"} size="56px" autoplay loop/> : <Sparkles size={24}/>}
            </div>
            <div style={{ flex:1 }}>
              <input type="file" accept=".tgs,.json" style={{ display:"none" }} id={`onb-upload-${idx}`}
                onChange={(e) => e.target.files?.[0] && handleUpload(idx,e.target.files[0])}/>
              <button className="btn btn-secondary" style={{ fontSize:12,padding:"8px 12px" }} disabled={uploadingIdx===idx}
                onClick={() => document.getElementById(`onb-upload-${idx}`).click()}>
                <Upload size={13}/> {uploadingIdx===idx ? "Uploading…" : "Upload Animation"}
              </button>
            </div>
          </div>
          <div className="field" style={{ marginBottom:8 }}>
            <div className="label">Title</div>
            <input className="input" value={page.title} onChange={(e) => updatePage(idx,{title:e.target.value})} placeholder="e.g. Welcome to MagicMall!"/>
          </div>
          <div className="field">
            <div className="label">Description</div>
            <textarea className="input" rows={3} style={{ resize:"none" }} value={page.description}
              onChange={(e) => updatePage(idx,{description:e.target.value})} placeholder="Tell users about this feature..."/>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary btn-full" onClick={addPage}><Plus size={15}/> Add Page</button>
      <button className="btn btn-primary btn-full" disabled={saving} onClick={save} style={{ padding:14 }}>
        {saving ? "Saving…" : "Save Onboarding Pages"}
      </button>
    </div>
  );
}
