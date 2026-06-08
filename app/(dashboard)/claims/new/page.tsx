"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReady } from "@/hooks/useReady";
import { addClaim, ClaimCode } from "@/lib/firestore/claims";
import { getPatients, Patient } from "@/lib/firestore/patients";
import { getProviders, Provider } from "@/lib/firestore/providers";
export const dynamic = 'force-dynamic';
const EC:ClaimCode={code:"",description:"",units:1,charge:0};

export default function NewClaimPage() {
  const router=useRouter();
  const params=useSearchParams();
  const { ready, queryCompanyId, companyId } = useReady();
  const [patients,setPatients]=useState<Patient[]>([]);
  const [providers,setProviders]=useState<Provider[]>([]);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({
    patientId:params.get("patientId")||"",patientName:params.get("patientName")||"",
    providerId:"",providerName:"",
    serviceDate:new Date().toISOString().split("T")[0],
    status:"draft" as const,
    diagnosisCodes:["","",""],
    procedureCodes:[{...EC}] as ClaimCode[],
    paidAmount:0,notes:"",
  });

  useEffect(()=>{
    if(!ready)return;
    getPatients(queryCompanyId).then(setPatients);
    getProviders(queryCompanyId).then(setProviders);
  },[ready,queryCompanyId]);

  const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(f=>({...f,[k]:e.target.value}));
  const setDx=(i:number)=>(e:React.ChangeEvent<HTMLInputElement>)=>{const a=[...form.diagnosisCodes];a[i]=e.target.value.toUpperCase();setForm(f=>({...f,diagnosisCodes:a}));};
  const setCpt=(i:number,k:keyof ClaimCode)=>(e:React.ChangeEvent<HTMLInputElement>)=>{const a=[...form.procedureCodes];a[i]={...a[i],[k]:k==="code"||k==="description"?e.target.value:parseFloat(e.target.value)||0};setForm(f=>({...f,procedureCodes:a}));};
  const addCptRow=()=>setForm(f=>({...f,procedureCodes:[...f.procedureCodes,{...EC}]}));
  const removeCpt=(i:number)=>setForm(f=>({...f,procedureCodes:f.procedureCodes.filter((_,j)=>j!==i)}));
  const totalCharge=form.procedureCodes.reduce((s,c)=>s+(c.charge*c.units),0);

  const onPatientChange=(e:React.ChangeEvent<HTMLSelectElement>)=>{
    const p=patients.find(p=>p.id===e.target.value);
    setForm(f=>({...f,patientId:e.target.value,patientName:p?`${p.firstName} ${p.lastName}`:""}));
  };
  const onProviderChange=(e:React.ChangeEvent<HTMLSelectElement>)=>{
    const p=providers.find(p=>p.id===e.target.value);
    setForm(f=>({...f,providerId:e.target.value,providerName:p?`${p.firstName} ${p.lastName}`:""}));
  };

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault(); setSaving(true);
    await addClaim({...form,companyId:companyId!,diagnosisCodes:form.diagnosisCodes.filter(Boolean),totalCharge});
    router.push("/claims");
  };

  if(!ready) return <div className="dash-content" style={{textAlign:"center",paddingTop:80,color:"var(--muted)"}}>Loading...</div>;

  return(
    <div className="dash-content">
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>router.push("/claims")}>← Back</button>
        <h1 className="sora" style={{fontSize:24,fontWeight:800}}>New Claim</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24}}>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div className="data-card" style={{padding:28}}>
              <div className="form-section">Claim Information</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">PATIENT ({patients.length} available)</label>
                  <select className="form-select" value={form.patientId} onChange={onPatientChange} required>
                    <option value="">Select patient...</option>
                    {patients.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">PROVIDER ({providers.length} available)</label>
                  <select className="form-select" value={form.providerId} onChange={onProviderChange} required>
                    <option value="">Select provider...</option>
                    {providers.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">SERVICE DATE</label><input className="form-input" type="date" value={form.serviceDate} onChange={set("serviceDate")} required/></div>
                <div className="form-group"><label className="form-label">STATUS</label>
                  <select className="form-select" value={form.status} onChange={set("status")}>
                    <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="data-card" style={{padding:28}}>
              <div className="form-section">Diagnosis Codes (ICD-10)</div>
              <div className="form-row">{form.diagnosisCodes.map((dx,i)=>(
                <div className="form-group" key={i}><label className="form-label">DX {i+1}</label>
                  <input className="form-input" placeholder="e.g. J18.9" value={dx} onChange={setDx(i)} style={{fontFamily:"monospace",textTransform:"uppercase"}}/>
                </div>
              ))}</div>
            </div>
            <div className="data-card" style={{padding:28}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div className="form-section" style={{margin:0}}>Procedure Codes (CPT)</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addCptRow}>+ Add Row</button>
              </div>
              <table className="tbl">
                <thead><tr><th>CPT Code</th><th>Description</th><th>Units</th><th>Charge</th><th></th></tr></thead>
                <tbody>{form.procedureCodes.map((cpt,i)=>(
                  <tr key={i}>
                    <td><input className="form-input" placeholder="99213" value={cpt.code} onChange={setCpt(i,"code")} style={{fontFamily:"monospace"}}/></td>
                    <td><input className="form-input" placeholder="Office visit" value={cpt.description} onChange={setCpt(i,"description")}/></td>
                    <td><input className="form-input" type="number" min={1} value={cpt.units} onChange={setCpt(i,"units")} style={{width:70}}/></td>
                    <td><input className="form-input" type="number" min={0} step={0.01} value={cpt.charge} onChange={setCpt(i,"charge")} style={{width:90}}/></td>
                    <td>{form.procedureCodes.length>1&&<button type="button" className="btn btn-danger btn-sm" onClick={()=>removeCpt(i)}>✕</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="data-card" style={{padding:28}}>
              <div className="form-section">Notes</div>
              <textarea className="form-input" rows={3} value={form.notes} onChange={set("notes")} style={{resize:"vertical"}}/>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="data-card" style={{padding:24}}>
              <div className="sora" style={{fontSize:16,fontWeight:700,marginBottom:20}}>Summary</div>
              {[["Patient",form.patientName||"—"],["Provider",form.providerName||"—"],["Date",form.serviceDate],["Status",form.status],["Procedures",form.procedureCodes.length],["Diagnoses",form.diagnosisCodes.filter(Boolean).length]].map(([k,v])=>(
                <div className="detail-row" key={String(k)}><span className="detail-key">{k}</span><span className="detail-val">{String(v)}</span></div>
              ))}
              <div style={{marginTop:20,padding:16,background:"rgba(27,111,235,0.1)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{fontSize:13,color:"var(--muted)",marginBottom:4}}>TOTAL CHARGE</div>
                <div className="sora" style={{fontSize:28,fontWeight:800,color:"var(--blue2)"}}>${totalCharge.toFixed(2)}</div>
              </div>
            </div>
            <button type="submit" className="btn btn-blue btn-full" disabled={saving} style={{padding:16}}>{saving?"Saving...":"💾 Save Claim"}</button>
            <button type="button" className="btn btn-ghost btn-full" onClick={()=>router.push("/claims")}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
