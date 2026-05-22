"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClaims, Claim } from "@/lib/firestore/claims";
import { getPatients } from "@/lib/firestore/patients";
import { getProviders } from "@/lib/firestore/providers";

const SB:Record<string,string>={paid:"badge-green",submitted:"badge-blue",denied:"badge-red",draft:"badge-gray",pending:"badge-yellow"};

export default function DashboardPage() {
  const { user, companyId } = useAuth();
  const [claims,setClaims]=useState<Claim[]>([]);
  const [pc,setPc]=useState(0);
  const [prc,setPrc]=useState(0);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([getClaims(companyId||undefined),getPatients(companyId||undefined),getProviders(companyId||undefined)])
    .then(([c,p,pr])=>{setClaims(c);setPc(p.length);setPrc(pr.length);setLoading(false);});
  },[companyId]);

  const totalCharge=claims.reduce((s,c)=>s+(c.totalCharge||0),0);
  const totalPaid=claims.reduce((s,c)=>s+(c.paidAmount||0),0);
  const denied=claims.filter(c=>c.status==="denied").length;
  const submitted=claims.filter(c=>c.status==="submitted").length;
  const fmt=(n:number)=>"$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  const greet=()=>{const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";};

  return (
    <div className="dash-content">
      <div style={{marginBottom:32}}>
        <h1 className="sora" style={{fontSize:26,fontWeight:800,marginBottom:4}}>{greet()}, {user?.displayName?.split(" ")[0]||"there"} 👋</h1>
        <p style={{color:"var(--muted)",fontSize:14}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
      </div>
      <div className="stat-grid">
        {[
          {icon:"📋",label:"Total Claims",val:loading?"—":claims.length,sub:`${submitted} pending`,color:"#3D8EFF"},
          {icon:"💰",label:"Total Charges",val:loading?"—":fmt(totalCharge),sub:`${fmt(totalPaid)} collected`,color:"#00D48A"},
          {icon:"👤",label:"Patients",val:loading?"—":pc,sub:"registered",color:"#00D4FF"},
          {icon:"🚫",label:"Denied",val:loading?"—":denied,sub:"require attention",color:"#FF4D6A"},
        ].map((s,i)=>(
          <div className="stat-card" key={i}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{color:s.color}}>{s.val}</div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24,marginTop:24}}>
        <div className="data-card">
          <div className="data-card-header"><span className="data-card-title sora">Recent Claims</span><a href="/claims" className="btn btn-ghost btn-sm">View all →</a></div>
          {loading?(<div style={{padding:32,textAlign:"center",color:"var(--muted)"}}>Loading...</div>)
          :claims.length===0?(<div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No claims yet</div><a href="/claims/new" className="btn btn-blue btn-sm">New Claim</a></div>):(
            <table className="tbl">
              <thead><tr><th>Patient</th><th>Provider</th><th>Date</th><th>Charge</th><th>Status</th></tr></thead>
              <tbody>
                {claims.slice(0,8).map(c=>(
                  <tr key={c.id}>
                    <td><a href={`/claims/${c.id}`} className="tbl-link">{c.patientName}</a></td>
                    <td style={{color:"var(--muted)",fontSize:13}}>{c.providerName}</td>
                    <td style={{color:"var(--muted)",fontSize:13}}>{c.serviceDate}</td>
                    <td style={{fontWeight:600}}>${(c.totalCharge||0).toFixed(2)}</td>
                    <td><span className={`badge ${SB[c.status]||"badge-gray"}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="data-card" style={{padding:24}}>
            <div className="sora" style={{fontSize:15,fontWeight:700,marginBottom:16}}>Quick Actions</div>
            {[{href:"/claims/new",icon:"📋",label:"New Claim",sub:"Submit a claim"},{href:"/patients",icon:"👤",label:"Add Patient",sub:"Register patient"},{href:"/providers",icon:"🏥",label:"Add Provider",sub:"Add provider"},{href:"/reports",icon:"📈",label:"Reports",sub:"View analytics"}].map((a,i)=>(
              <a key={i} href={a.href} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?"1px solid var(--border)":"none",textDecoration:"none"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(27,111,235,0.12)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{a.icon}</div>
                <div><div style={{fontSize:14,fontWeight:600,color:"var(--white)"}}>{a.label}</div><div style={{fontSize:12,color:"var(--muted)"}}>{a.sub}</div></div>
              </a>
            ))}
          </div>
          <div className="data-card" style={{padding:24}}>
            <div className="sora" style={{fontSize:15,fontWeight:700,marginBottom:16}}>Summary</div>
            {[{label:"Patients",val:pc},{label:"Providers",val:prc},{label:"Paid",val:claims.filter(c=>c.status==="paid").length},{label:"Submitted",val:submitted}].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?"1px solid var(--border)":"none"}}>
                <span style={{fontSize:13,color:"var(--muted)"}}>{r.label}</span>
                <span style={{fontSize:14,fontWeight:700}}>{loading?"—":r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
