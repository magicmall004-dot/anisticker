import { useState, useEffect } from "react";
import { TrendingUp, Package, Users, Wallet, Star, RefreshCw } from "lucide-react";
import api from "../lib/api";
import { formatPrice } from "../lib/utils";
import AnimationPreview from "../components/AnimationPreview";

function StatCard({ icon: Icon, label, value, sub, color="#04D9FF" }) {
  return (
    <div className="card" style={{ display:"flex",alignItems:"center",gap:12 }}>
      <div style={{ width:40,height:40,borderRadius:10,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <Icon size={20} color={color}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11,color:"var(--hint)" }}>{label}</div>
        <div style={{ fontSize:20,fontWeight:800,color }}>{value}</div>
        {sub && <div style={{ fontSize:11,color:"var(--hint)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color="#04D9FF" }) {
  const pct = max > 0 ? (value/max)*100 : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div className="row-between" style={{ marginBottom:4 }}>
        <div style={{ fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{label}</div>
        <div style={{ fontSize:12,color,fontWeight:700,marginLeft:8,flexShrink:0 }}>{formatPrice(value)}</div>
      </div>
      <div style={{ height:5,borderRadius:99,background:"var(--card)",overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${pct}%`,borderRadius:99,background:color,transition:"width 0.6s ease" }}/>
      </div>
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d=>d.revenue), 1);
  return (
    <div style={{ display:"flex",alignItems:"flex-end",gap:4,height:80,padding:"4px 0" }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
          <div style={{ width:"100%",borderRadius:"3px 3px 0 0",background:`rgba(4,217,255,${0.3+0.7*(d.revenue/max)})`,height:`${Math.max(4,(d.revenue/max)*100)}%`,transition:"height 0.5s ease",cursor:"default" }} title={`${d.label}: ${formatPrice(d.revenue)}`}/>
          <div style={{ fontSize:8,color:"var(--hint)",textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",width:"100%",textOverflow:"ellipsis" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("7d");

  useEffect(() => { load(); }, [period]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/?period=${period}`);
      setData(res.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{display:"flex",justifyContent:"center",padding:48}}><div className="spinner"/></div>;
  if (!data) return <div className="empty-state">Failed to load analytics</div>;

  return (
    <div className="page-body">
      {/* Period selector */}
      <div className="scroll-row">
        {[["7d","7 Days"],["30d","30 Days"],["all","All Time"]].map(([v,l]) => (
          <div key={v} className={`pill ${period===v?"active":""}`} onClick={() => setPeriod(v)}>{l}</div>
        ))}
        <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={load}>
          <RefreshCw size={14} className={loading?"refresh-spin":""}/>
        </button>
      </div>

      {/* Key stats */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
        <StatCard icon={TrendingUp} label="Revenue" value={formatPrice(data.total_revenue)} sub={`${data.order_count} orders`} color="#04D9FF"/>
        <StatCard icon={Package} label="Completed" value={data.done_count} sub={`${data.pending_count} pending`} color="#22c55e"/>
        <StatCard icon={Users} label="Customers" value={data.customer_count} sub="unique" color="#a78bfa"/>
        <StatCard icon={Wallet} label="Avg Order" value={formatPrice(data.avg_order)} sub="per order" color="#f59e0b"/>
      </div>

      {/* Revenue chart */}
      {data.chart?.length > 0 && (
        <>
          <div className="section-title">Revenue Trend</div>
          <div className="card">
            <RevenueChart data={data.chart}/>
          </div>
        </>
      )}

      {/* Status breakdown */}
      <div className="section-title">Order Status</div>
      <div className="card">
        {[
          {label:"Done",      value:data.done_count,      color:"#22c55e"},
          {label:"Pending",   value:data.pending_count,   color:"#f59e0b"},
          {label:"Accepted",  value:data.accepted_count,  color:"#04D9FF"},
          {label:"Cancelled", value:data.cancelled_count, color:"#ef4444"},
        ].map(s => (
          <MiniBar key={s.label} label={s.label} value={s.value} max={data.order_count||1} color={s.color}/>
        ))}
      </div>

      {/* Top designs */}
      {data.top_designs?.length > 0 && (
        <>
          <div className="section-title">Top Designs</div>
          {data.top_designs.map((d,i) => (
            <div key={i} className="card">
              <div className="row" style={{gap:10}}>
                <div style={{fontSize:16,fontWeight:800,color:"var(--hint)",minWidth:20,textAlign:"center"}}>{i+1}</div>
                {d.file_url && (
                  <div style={{width:36,height:36,borderRadius:8,overflow:"hidden",flexShrink:0}}>
                    <AnimationPreview url={d.file_url} fileType={d.file_type} size="36px" autoplay loop/>
                  </div>
                )}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{d.name||`#${d.custom_id}`}</div>
                  <div style={{fontSize:11,color:"var(--hint)"}}>{d.order_count} orders · {formatPrice(d.revenue)} revenue</div>
                </div>
                <div style={{fontWeight:800,color:"var(--accent)",fontSize:13}}>{formatPrice(d.revenue)}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Top customers */}
      {data.top_customers?.length > 0 && (
        <>
          <div className="section-title">Top Customers</div>
          {data.top_customers.map((c,i) => (
            <div key={i} className="card">
              <div className="row" style={{gap:10}}>
                <div style={{fontSize:14,fontWeight:800,color:"var(--hint)",minWidth:20,textAlign:"center"}}>{i+1}</div>
                {c.photo_url && <img src={c.photo_url} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{c.first_name} {c.last_name}</div>
                  {c.username && <div style={{fontSize:11,color:"var(--hint)"}}> @{c.username}</div>}
                </div>
                <div>
                  <div style={{fontWeight:800,color:"var(--accent)",fontSize:13,textAlign:"right"}}>{formatPrice(c.total_spent)}</div>
                  <div style={{fontSize:10,color:"var(--hint)",textAlign:"right"}}>{c.order_count} orders</div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
