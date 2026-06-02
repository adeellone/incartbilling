"use client";
import { useEffect, useState } from "react";
import { useReady } from "@/hooks/useReady";
import { getCompany, updateCompany, Company } from "@/lib/firestore/companies";
import { getUsersByCompany, AppUser } from "@/lib/firestore/users";
import { getProviders } from "@/lib/firestore/providers";
import { getPatients } from "@/lib/firestore/patients";
import { getClaims } from "@/lib/firestore/claims";

const PLAN_INFO:Record<string,{label:string;color:string;features:string[]}>={
  trial:{label:"Free Trial",color:"var(--yellow)",features:["Up to 5 providers","50 claims/month","Basic reports"]},
  starter:{label:"Starter",color:"var(--blue2)",features:["Up to 10 providers","500 claims/month","Full reports","Email support"]},
  professional:{label:"Professional",color:"var(--green)",features:["Unlimited providers","Unlimited claims","Analytics","Priority support"]},
  enterprise:{label:"Enterprise",color:"var(--cyan)",features:["Everything in Pro","Custom integrations","White-label","Dedicated manager"]},
};

export default function CompanyPage() {
  const { ready, companyId, queryCompanyId } = useReady();
  const [company,setCompany]=useState<Company|null>(null);
  const [users,setUsers]=useState<AppUser[]>([]);
  const [providerCount,setProviderCount]=useState(0);
  const [patientCount,setPatientCount]=useState(0);
  const [claimCount,setClaimCount]=useState(0);
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState<Partial<Company>>({});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!ready||!companyId)return;
    Promise.all([
      getCompany(companyId),
      getUsersByCompany(companyId),
      getProviders(queryCompanyId),
      getPatients(queryCompanyId),
      getClaims(queryCompanyId),
    ]).then(([c,u,pr,p,cl])=>{
      setCompany(c); setForm(c||{});
      setUsers(u);
      setProviderCount(pr.length);
      setPatientCount(p.length);
      setClaimCount(cl.length);
    });
  },[ready,companyId,queryCompanyId]);

  const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,[k]:e.target.value}));

  const handleSave=async()=>{
    if(!companyId)return; setSaving(true);
    await updateCompany(companyId,form);
    const updated=await getCompany(companyId);
    setCompany(updated); setEditing(false); setSaving(false);
  };

  if(!ready||!company) return <div className="dash-content" style={{textAlign:"center",paddingTop:80,color:"var(--muted)"}}>Loading...</div>;

  const plan=PLAN_INFO[company.plan]||PLAN_INFO.trial;

  return(
    <div className="dash-content">
      <div style={{marginBottom:28}}>
        <h1 className="sora" style={{fontSize:24,fontWeight:800}}>My Company</h1>
        <p style={{color:"var(--muted)",fontSize:13,marginTop:4}}>Manage settings and subscription</p>
      </div>

      {/* Stats Row */}
      <div className="stat-grid" style={{marginBottom:24}}>
        {[
          {icon:"🏥",label:"Providers",val:providerCount,color:"var(--blue2)"},
          {icon:"👤",label:"Patients",val:patientCount,color:"var(--cyan)"},
          {icon:"📋",label:"Claims",val:claimCount,color:"var(--white)"},
          {icon:"👥",label:"Team Members",val:users.length,color:"var(--green)"},
        ].map((s,i)=>(
          <div className="stat-card" key={i}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{color:s.color}}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24}}>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* Company Details */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Company Details</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(!editing)}>{editing?"Cancel":"Edit"}</button>
            </div>
            <div style={{padding:24}}>
              {editing?(
                <div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">COMPANY NAME</label><input className="form-input" value={form.name||""} onChange={set("name")}/></div>
                    <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email||""} onChange={set("email")}/></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">PHONE</label><input className="form-input" value={form.phone||""} onChange={set("phone")}/></div>
                    <div className="form-group"><label className="form-label">ADDRESS</label><input className="form-input" value={form.address||""} onChange={set("address")}/></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-blue" onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
                  </div>
                </div>
              ):(
                [["Company Name",company.name],["Email",company.email],["Phone",company.phone||"—"],["Address",company.address||"—"],["Status",company.active?"✅ Active":"⛔ Suspended"]].map(([k,v])=>(
                  <div className="detail-row" key={k}><span className="detail-key">{k}</span><span className="detail-val">{v}</span></div>
                ))
              )}
            </div>
          </div>

          {/* Team Breakdown */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Team ({users.length})</span>
              <a href="/team" className="btn btn-ghost btn-sm">Manage →</a>
            </div>
            <div style={{padding:24}}>
              {[
                {label:"Company Admins", val:users.filter(u=>u.role==="company_admin").length},
                {label:"Billing Staff",  val:users.filter(u=>u.role==="billing_staff").length},
                {label:"Provider Users", val:users.filter(u=>u.role==="provider").length},
                {label:"Active",         val:users.filter(u=>u.active).length},
              ].map((r,i,arr)=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
                  <span style={{fontSize:13,color:"var(--muted)"}}>{r.label}</span>
                  <span style={{fontSize:18,fontWeight:800,fontFamily:"Sora,sans-serif"}}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="data-card" style={{padding:24}}>
            <div className="sora" style={{fontSize:15,fontWeight:700,marginBottom:16}}>Quick Links</div>
            {[
              {href:"/providers",icon:"🏥",label:"Manage Providers",sub:`${providerCount} providers`},
              {href:"/patients",icon:"👤",label:"Manage Patients",sub:`${patientCount} patients`},
              {href:"/claims",icon:"📋",label:"View Claims",sub:`${claimCount} total claims`},
              {href:"/team",icon:"👥",label:"Manage Team",sub:`${users.length} members`},
            ].map((a,i)=>(
              <a key={i} href={a.href} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?"1px solid var(--border)":"none",textDecoration:"none"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(27,111,235,0.12)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{a.icon}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--white)"}}>{a.label}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{a.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Plan Card */}
        <div>
          <div className="data-card" style={{padding:28}}>
            <div className="sora" style={{fontSize:15,fontWeight:700,marginBottom:6}}>Current Plan</div>
            <div style={{fontSize:28,fontWeight:800,fontFamily:"Sora,sans-serif",color:plan.color,marginBottom:20}}>{plan.label}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {plan.features.map(f=>(
                <div key={f} style={{display:"flex",gap:8,fontSize:13,color:"var(--muted)"}}><span style={{color:"var(--green)"}}>✓</span>{f}</div>
              ))}
            </div>
            <div style={{background:"rgba(27,111,235,0.08)",border:"1px solid var(--border)",borderRadius:10,padding:16,textAlign:"center"}}>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>Want to upgrade?</div>
              <a href="mailto:sales@incartbilling.com" className="btn btn-blue btn-sm">Contact Sales</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
