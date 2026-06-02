"use client";
import { useEffect, useState } from "react";
import { useReady } from "@/hooks/useReady";
import { getCredentialings, addCredentialing, deleteCredentialing, Credentialing, CredentialingStatus, getExpiryStatus, daysUntilExpiry } from "@/lib/firestore/credentialing";
import { getProviders, Provider } from "@/lib/firestore/providers";

const SB:Record<CredentialingStatus,string>={pending:"badge-gray",in_progress:"badge-yellow",approved:"badge-green",expired:"badge-red",rejected:"badge-red"};
const PAYERS=["Medicare","Medicaid","Blue Cross Blue Shield","Aetna","Cigna","UnitedHealth","Humana","Tricare","Anthem","Molina"];
const EP={payerName:"",payerId:"",status:"not_started" as const,submittedDate:"",approvedDate:"",notes:""};

const ExpiryBadge=({date}:{date:string})=>{
  if(!date)return<span style={{color:"var(--muted)",fontSize:12}}>—</span>;
  const s=getExpiryStatus(date),d=daysUntilExpiry(date);
  const cls=s==="expired"?"badge-red":s==="expiring_soon"?"badge-yellow":"badge-green";
  const label=s==="expired"?"Expired":s==="expiring_soon"?`${d}d left`:"Valid";
  return<span className={`badge ${cls}`} style={{fontSize:11}}>{label}</span>;
};

export default function CredentialingPage() {
  const { ready, queryCompanyId, companyId } = useReady();
  const [creds,setCreds]=useState<Credentialing[]>([]);
  const [providers,setProviders]=useState<Provider[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState<Omit<Credentialing,"id"|"createdAt"|"updatedAt">>({
    companyId:"",providerId:"",providerName:"",npi:"",
    licenseNumber:"",licenseState:"",licenseExpiry:"",
    deaNumber:"",deaExpiry:"",
    malpracticeInsurer:"",malpracticeExpiry:"",malpracticePolicyNumber:"",
    boardCertification:"",boardExpiry:"",payers:[],status:"pending",notes:"",
  });

  const load=async()=>{
    if(!ready)return;
    const [c,p]=await Promise.all([getCredentialings(queryCompanyId),getProviders(queryCompanyId)]);
    setCreds(c); setProviders(p); setLoading(false);
  };

  useEffect(()=>{ if(ready) load(); },[ready,queryCompanyId]);

  const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(f=>({...f,[k]:e.target.value}));
  const onProviderChange=(e:React.ChangeEvent<HTMLSelectElement>)=>{
    const p=providers.find(p=>p.id===e.target.value);
    setForm(f=>({...f,providerId:e.target.value,providerName:p?`${p.firstName} ${p.lastName}`:"",npi:p?.npi||""}));
  };
  const addPayer=()=>setForm(f=>({...f,payers:[...f.payers,{...EP}]}));
  const removePayer=(i:number)=>setForm(f=>({...f,payers:f.payers.filter((_,j)=>j!==i)}));
  const setPayer=(i:number,k:string,v:string)=>setForm(f=>{ const p=[...f.payers]; p[i]={...p[i],[k]:v}; return{...f,payers:p}; });

  const handleAdd=async(e:React.FormEvent)=>{
    e.preventDefault(); setSaving(true);
    await addCredentialing({...form,companyId:companyId!});
    setShowForm(false); setSaving(false); load();
  };

  const alerts=creds.filter(c=>[c.licenseExpiry,c.deaExpiry,c.malpracticeExpiry,c.boardExpiry].some(f=>["expired","expiring_soon"].includes(getExpiryStatus(f))));
  if(!ready) return <div className="dash-content" style={{textAlign:"center",paddingTop:80,color:"var(--muted)"}}>Loading...</div>;

  return(
    <div className="dash-content">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div><h1 className="sora" style={{fontSize:24,fontWeight:800}}>Credentialing</h1><p style={{color:"var(--muted)",fontSize:13,marginTop:4}}>{creds.length} providers credentialed</p></div>
        <button className="btn btn-blue" onClick={()=>setShowForm(!showForm)}>+ New Credentialing</button>
      </div>
      {alerts.length>0&&(
        <div style={{background:"rgba(255,184,0,0.1)",border:"1px solid rgba(255,184,0,0.3)",borderRadius:12,padding:16,marginBottom:24}}>
          <div style={{fontWeight:600,color:"var(--yellow)",marginBottom:8}}>⚠️ {alerts.length} provider(s) have expiring credentials</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{alerts.map(c=><span key={c.id} className="badge badge-yellow">{c.providerName}</span>)}</div>
        </div>
      )}
      <div className="stat-grid" style={{marginBottom:24}}>
        {[
          {label:"Total",val:creds.length,color:"var(--white)"},
          {label:"Approved",val:creds.filter(c=>c.status==="approved").length,color:"var(--green)"},
          {label:"In Progress",val:creds.filter(c=>c.status==="in_progress").length,color:"var(--yellow)"},
          {label:"Expired",val:creds.filter(c=>c.status==="expired").length,color:"var(--red)"},
        ].map((s,i)=><div className="stat-card" key={i}><div className="stat-card-label">{s.label}</div><div className="stat-card-val" style={{color:s.color}}>{s.val}</div></div>)}
      </div>
      {showForm&&(
        <div style={{marginBottom:24}}>
          <form className="panel" style={{maxWidth:"100%"}} onSubmit={handleAdd}>
            <div className="panel-title sora">New Credentialing Profile</div>
            <div className="form-section">Provider</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">SELECT PROVIDER ({providers.length} available)</label>
                <select className="form-select" value={form.providerId} onChange={onProviderChange} required>
                  <option value="">Select provider...</option>
                  {providers.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">NPI</label><input className="form-input" value={form.npi} onChange={set("npi")} style={{fontFamily:"monospace"}} required/></div>
              <div className="form-group"><label className="form-label">STATUS</label>
                <select className="form-select" value={form.status} onChange={set("status")}>{["pending","in_progress","approved","expired","rejected"].map(s=><option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <hr className="form-divider"/>
            <div className="form-section">Medical License</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">LICENSE #</label><input className="form-input" value={form.licenseNumber} onChange={set("licenseNumber")} style={{fontFamily:"monospace"}}/></div>
              <div className="form-group"><label className="form-label">STATE</label><input className="form-input" placeholder="CA" value={form.licenseState} onChange={set("licenseState")}/></div>
              <div className="form-group"><label className="form-label">EXPIRY</label><input className="form-input" type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")}/></div>
            </div>
            <hr className="form-divider"/>
            <div className="form-section">DEA & Malpractice</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">DEA #</label><input className="form-input" value={form.deaNumber} onChange={set("deaNumber")} style={{fontFamily:"monospace"}}/></div>
              <div className="form-group"><label className="form-label">DEA EXPIRY</label><input className="form-input" type="date" value={form.deaExpiry} onChange={set("deaExpiry")}/></div>
              <div className="form-group"><label className="form-label">MALPRACTICE INSURER</label><input className="form-input" value={form.malpracticeInsurer} onChange={set("malpracticeInsurer")}/></div>
              <div className="form-group"><label className="form-label">MALPRACTICE EXPIRY</label><input className="form-input" type="date" value={form.malpracticeExpiry} onChange={set("malpracticeExpiry")}/></div>
            </div>
            <hr className="form-divider"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div className="form-section" style={{margin:0}}>Payer Enrollments</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addPayer}>+ Add Payer</button>
            </div>
            {form.payers.map((p,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",borderRadius:10,padding:16,marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:12,alignItems:"flex-end"}}>
                  <div className="form-group" style={{margin:0}}><label className="form-label">PAYER</label>
                    <select className="form-select" value={p.payerName} onChange={e=>setPayer(i,"payerName",e.target.value)}>
                      <option value="">Select...</option>{PAYERS.map(py=><option key={py}>{py}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">STATUS</label>
                    <select className="form-select" value={p.status} onChange={e=>setPayer(i,"status",e.target.value)}>
                      {["not_started","submitted","approved","rejected"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">SUBMITTED</label><input className="form-input" type="date" value={p.submittedDate} onChange={e=>setPayer(i,"submittedDate",e.target.value)}/></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">APPROVED</label><input className="form-input" type="date" value={p.approvedDate} onChange={e=>setPayer(i,"approvedDate",e.target.value)}/></div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={()=>removePayer(i)}>✕</button>
                </div>
              </div>
            ))}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving?"Saving...":"Save Credentialing"}</button>
            </div>
          </form>
        </div>
      )}
      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">All Providers</span></div>
        {loading?(<div style={{padding:32,textAlign:"center",color:"var(--muted)"}}>Loading...</div>)
        :creds.length===0?(<div className="empty"><div className="empty-icon">📜</div><div className="empty-title">No credentialing records</div>{providers.length===0&&<p style={{color:"var(--red)",fontSize:13,marginTop:8}}>⚠️ Add providers first before creating credentialing</p>}<button className="btn btn-blue btn-sm" onClick={()=>setShowForm(true)}>Start Credentialing</button></div>):(
          <table className="tbl">
            <thead><tr><th>Provider</th><th>NPI</th><th>License</th><th>DEA</th><th>Malpractice</th><th>Payers</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{creds.map(c=>(
              <tr key={c.id}>
                <td style={{fontWeight:600}}><a href={`/credentialing/${c.id}`} className="tbl-link">{c.providerName}</a></td>
                <td style={{fontFamily:"monospace",fontSize:12,color:"var(--muted)"}}>{c.npi||"—"}</td>
                <td><ExpiryBadge date={c.licenseExpiry}/></td>
                <td><ExpiryBadge date={c.deaExpiry}/></td>
                <td><ExpiryBadge date={c.malpracticeExpiry}/></td>
                <td>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {c.payers?.slice(0,2).map((p,i)=><span key={i} className={`badge ${p.status==="approved"?"badge-green":p.status==="submitted"?"badge-yellow":"badge-gray"}`} style={{fontSize:10}}>{p.payerName?.split(" ")[0]}</span>)}
                    {(c.payers?.length||0)>2&&<span className="badge badge-gray" style={{fontSize:10}}>+{c.payers.length-2}</span>}
                  </div>
                </td>
                <td><span className={`badge ${SB[c.status]}`}>{c.status.replace("_"," ")}</span></td>
                <td><div style={{display:"flex",gap:8}}><a href={`/credentialing/${c.id}`} className="btn btn-ghost btn-sm">View</a><button className="btn btn-danger btn-sm" onClick={()=>{ if(confirm("Delete?")) deleteCredentialing(c.id!).then(load); }}>Del</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
