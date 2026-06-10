import { useState, useEffect } from "react";
import { getUsers, setUserRole, setUserBan } from "../lib/api";
import { Shield, Ban, ChevronDown } from "lucide-react";
import { hapticNotification } from "../lib/telegram";

const ROLES = ["user", "reseller", "owner"];

export default function OwnerUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setUsers(await getUsers()); }
    finally { setLoading(false); }
  }

  async function changeRole(user, role) {
    try {
      await setUserRole(user.id, role);
      hapticNotification("success");
      await load();
    } catch (e) { alert(e.response?.data?.detail || e.message); }
  }

  async function toggleBan(user) {
    const action = user.is_banned ? "Unban" : "Ban";
    if (!confirm(`${action} ${user.first_name}?`)) return;
    try {
      await setUserBan(user.id, !user.is_banned);
      hapticNotification(user.is_banned ? "success" : "warning");
      await load();
    } catch (e) { alert(e.response?.data?.detail || e.message); }
  }

  const shown = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)  ||
      u.username?.toLowerCase().includes(q)   ||
      String(u.id).includes(q)
    );
  });

  const roleColor = { owner:"#f59e0b", reseller:"var(--btn)", user:"var(--hint)" };

  return (
    <div className="page-body">
      {/* Search */}
      <input className="input" value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, username, or ID…" />

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {["owner","reseller","user"].map((role) => (
          <div key={role} className="card" style={{ textAlign:"center", padding:"10px 8px" }}>
            <div style={{ fontSize:18, fontWeight:700, color:roleColor[role] }}>
              {users.filter(u=>u.role===role).length}
            </div>
            <div style={{ fontSize:11, color:"var(--hint)", textTransform:"capitalize" }}>{role}s</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
          <div className="spinner" />
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">No users found</div>
      ) : (
        shown.map((u) => (
          <div key={u.id} className="card"
            style={{ opacity: u.is_banned ? 0.55 : 1 }}>
            <div className="row-between">
              {/* Avatar + name */}
              <div className="row" style={{ gap:10 }}>
                {u.photo_url ? (
                  <img src={u.photo_url} alt=""
                    style={{ width:40,height:40,borderRadius:"50%",objectFit:"cover",flexShrink:0 }} />
                ) : (
                  <div style={{
                    width:40,height:40,borderRadius:"50%",flexShrink:0,
                    background:"rgba(255,255,255,.08)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontWeight:700, fontSize:16,
                  }}>
                    {(u.first_name||"?")[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>
                    {u.first_name} {u.last_name}
                    {u.is_banned && (
                      <span style={{ marginLeft:6,fontSize:11,color:"var(--danger)",
                        background:"rgba(239,68,68,.15)",padding:"1px 6px",borderRadius:99 }}>
                        banned
                      </span>
                    )}
                  </div>
                  {u.username && <div style={{ fontSize:12,color:"var(--hint)" }}>@{u.username}</div>}
                  <div style={{ fontSize:11,color:"var(--hint)" }}>ID: {u.id}</div>
                </div>
              </div>

              {/* Role badge */}
              <span style={{
                fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,
                background: roleColor[u.role] + "22",
                color:      roleColor[u.role],
                textTransform:"capitalize",
              }}>
                {u.role}
              </span>
            </div>

            {/* Actions */}
            <div className="row" style={{ marginTop:10, gap:8 }}>
              {/* Role select */}
              <div style={{ position:"relative", flex:1 }}>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value)}
                  style={{
                    width:"100%", appearance:"none",
                    background:"rgba(255,255,255,.07)",
                    border:"1px solid rgba(255,255,255,.1)",
                    borderRadius:"var(--radius-sm)",
                    color:"var(--text)",
                    fontFamily:"var(--font)",
                    fontSize:13,
                    padding:"8px 32px 8px 10px",
                    cursor:"pointer",
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ background:"#2c2c2e" }}>
                      {r.charAt(0).toUpperCase()+r.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{
                  position:"absolute",right:8,top:"50%",
                  transform:"translateY(-50%)",pointerEvents:"none",
                  color:"var(--hint)",
                }} />
              </div>

              {/* Ban/Unban */}
              <button
                className={`btn ${u.is_banned ? "btn-success" : "btn-danger"}`}
                style={{ padding:"8px 12px",fontSize:13 }}
                onClick={() => toggleBan(u)}
              >
                <Ban size={14} />
                {u.is_banned ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
