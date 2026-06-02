"use client";
import { useEffect, useState } from "react";
import { useReady } from "@/hooks/useReady";
import { getUsersByCompany, updateUserProfile, createUserProfile, AppUser, UserRole } from "@/lib/firestore/users";
import { ROLE_PERMISSIONS, Permission } from "@/lib/permissions";

const RB:Record<UserRole,string>={superadmin:"badge-cyan",company_admin:"badge-blue",billing_staff:"badge-gray",provider:"badge-green"};
const RL:Record<UserRole,string>={superadmin:"Super Admin",company_admin:"Company Admin",billing_staff:"Billing Staff",provider:"Provider"};

const ALL_PERMISSIONS: {key: keyof Permission; label: string}[] = [
  {key:"canViewClaims",label:"View Claims"},{key:"canEditClaims",label:"Edit Claims"},
  {key:"canViewPatients",label:"View Patients"},{key:"canEditPatients",label:"Edit Patients"},
  {key:"canViewProviders",label:"View Providers"},{key:"canEditProviders",label:"Edit Providers"},
  {key:"canViewCredentialing",label:"View Credentialing"},{key:"canEditCredentialing",label:"Edit Credentialing"},
  {key:"canViewDocuments",label:"View Documents"},{key:"canEditDocuments",label:"Edit Documents"},
  {key:"canViewPayments",label:"View Payments"},{key:"canEditPayments",label:"Edit Payments"},
  {key:"canViewDenials",label:"View Denials"},{key:"canEditDenials",label:"Edit Denials"},
  {key:"canViewReports",label:"View Reports"},{key:"canViewTeam",label:"View Team"},
];

export default function TeamPage() {
  const { ready, companyId } = useReady();
  const [users,setUsers]=useState<AppUser[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"billing_staff" as UserRole});
  const [error,setError]=useState("");
  const [editingUser,setEditingUser]=useState<AppUser|null>(null);
  const [customPerms,setCustomPerms]=useState<Partial<Permission>>({});

  const load=async()=>{ if(!companyId)return; const u=await getUsersByCompany(companyId); setUsers(u); setLoading(false); };
  useEffect(()=>{ if(ready) load(); },[ready,companyId]);

  const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(f=>({...f,[k]:e.target.value}));

  const handleAdd=async(e:React.FormEvent)=>{
    e.preventDefault(); setError(""); setSaving(true);
    try{
      const {initializeApp,deleteApp}=await import("firebase/app");
      const {getAuth,createUserWithEmailAndPassword,updateProfile}=await import("firebase/auth");
      const {auth}=await import("@/lib/firebase");
      const secondaryApp=initializeApp(auth.app.options,"secondary-"+Date.now());
      const secondaryAuth=getAuth(secondaryApp);
      const cred=await createUserWithEmailAndPassword(secondaryAuth,form.email,form.password);
      await updateProfile(cred.user,{displayName:form.name});
      await createUserProfile(cred.user.uid,{email:form.email,displayName:form.name,role:form.role,companyId:companyId!,active:true});
      await deleteApp(secondaryApp);
      setForm({name:"",email:"",password:"",role:"billing_staff"});
      setShowForm(false); load();
    }catch(err:unknown){ setError((err as{message?:string}).message||"Failed"); }
    finally{ setSaving(false); }
  };

  const openPermissions=(u:AppUser)=>{
    setEditingUser(u);
    const defaults=ROLE_PERMISSIONS[u.role];
    setCustomPerms(u.customPermissions||defaults);
  };

  const savePermissions=async()=>{
    if(!editingUser)return;
    await updateUserProfile(editingUser.uid,{customPermissions:customPerms});
    setEditingUser(null); load();
  };

  if(!ready) return <div className="dash-content" style={{textAlign:"center",paddingTop:80,color:"var(--muted)"}}>Loading...</div>;

  return(
    <div className="dash-content">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div><h1 className="sora" style={{fontSize:24,fontWeight:800}}>Team Members</h1><p style={{color:"var(--muted)",fontSize:13,marginTop:4}}>{users.length} members</p></div>
        <button className="btn btn-blue" onClick={()=>setShowForm(!showForm)}>+ Invite Member</button>
      </div>

      {/* Permission Editor Modal */}
      {editingUser&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div className="panel" style={{maxWidth:600,width:"100%",maxHeight:"80vh",overflowY:"auto"}}>
            <div className="panel-title sora">Permissions — {editingUser.displayName}</div>
            <div style={{marginBottom:16}}>
              <span className={`badge ${RB[editingUser.role]}`}>{RL[editingUser.role]}</span>
              <span style={{fontSize:13,color:"var(--muted)",marginLeft:10}}>Custom permissions override role defaults</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
              {ALL_PERMISSIONS.map(({key,label})=>(
                <label key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,cursor:"pointer"}}>
                  <input type="checkbox" checked={!!customPerms[key]} onChange={e=>setCustomPerms(p=>({...p,[key]:e.target.checked}))} style={{accentColor:"var(--blue)",width:16,height:16}}/>
                  <span style={{fontSize:13}}>{label}</span>
                </label>
              ))}
            </div>
            <div style={{marginBottom:16,padding:12,background:"rgba(27,111,235,0.08)",borderRadius:8}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>Reset to role defaults:</div>
              <div style={{display:"flex",gap:8}}>
                {(["billing_staff","company_admin"] as UserRole[]).map(r=>(
                  <button key={r} className="btn btn-ghost btn-sm" onClick={()=>setCustomPerms(ROLE_PERMISSIONS[r])}>Use {RL[r]} defaults</button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={()=>setEditingUser(null)}>Cancel</button>
              <button className="btn btn-blue" onClick={savePermissions}>Save Permissions</button>
            </div>
          </div>
        </div>
      )}

      {showForm&&(
        <div style={{marginBottom:24}}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">Invite Team Member</div>
            {error&&<div className="err">⚠️ {error}</div>}
            <div className="form-row">
              <div className="form-group"><label className="form-label">FULL NAME</label><input className="form-input" value={form.name} onChange={set("name")} required/></div>
              <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email} onChange={set("email")} required/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">TEMP PASSWORD</label><input className="form-input" type="password" placeholder="Min 6 chars" value={form.password} onChange={set("password")} required/></div>
              <div className="form-group"><label className="form-label">ROLE</label>
                <select className="form-select" value={form.role} onChange={set("role")}>
                  <option value="billing_staff">Billing Staff</option>
                  <option value="company_admin">Company Admin</option>
                  <option value="provider">Provider (read-only)</option>
                </select>
              </div>
            </div>
            <div style={{padding:12,background:"rgba(27,111,235,0.06)",borderRadius:8,fontSize:13,color:"var(--muted)",marginBottom:16}}>
              💡 Default permissions for selected role will apply. You can customize after creation.
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving?"Creating...":"Create Member"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">Team ({users.length})</span></div>
        {loading?(<div style={{padding:32,textAlign:"center",color:"var(--muted)"}}>Loading...</div>)
        :users.length===0?(<div className="empty"><div className="empty-icon">👥</div><div className="empty-title">No team members yet</div></div>):(
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Permissions</th><th>Actions</th></tr></thead>
            <tbody>{users.map(u=>(
              <tr key={u.id}>
                <td style={{fontWeight:600}}>{u.displayName}</td>
                <td style={{color:"var(--muted)",fontSize:13}}>{u.email}</td>
                <td>
                  <select className="form-select" style={{width:"auto",fontSize:12,padding:"4px 8px"}} value={u.role}
                    onChange={async e=>{ await updateUserProfile(u.uid,{role:e.target.value as UserRole}); load(); }}>
                    <option value="billing_staff">Billing Staff</option>
                    <option value="company_admin">Company Admin</option>
                    <option value="provider">Provider</option>
                  </select>
                </td>
                <td><span className={`badge ${u.active?"badge-green":"badge-red"}`}>{u.active?"Active":"Inactive"}</span></td>
                <td>
                  {u.customPermissions
                    ?<span className="badge badge-blue" style={{fontSize:11}}>Custom</span>
                    :<span className="badge badge-gray" style={{fontSize:11}}>Default ({RL[u.role]})</span>
                  }
                </td>
                <td>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openPermissions(u)}>Permissions</button>
                    <button className={`btn btn-sm ${u.active?"btn-danger":"btn-ghost"}`}
                      onClick={()=>{ updateUserProfile(u.uid,{active:!u.active}); load(); }}>
                      {u.active?"Deactivate":"Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
