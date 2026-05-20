"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCompany, updateCompany, Company } from "@/lib/firestore/companies";
import { getUsersByCompany, AppUser } from "@/lib/firestore/users";

const PLAN_INFO: Record<string, { label:string; color:string; features:string[] }> = {
  trial:        { label:"Free Trial",    color:"var(--yellow)", features:["Up to 5 providers","50 claims/month","Basic reports"] },
  starter:      { label:"Starter",       color:"var(--blue2)",  features:["Up to 10 providers","500 claims/month","Full reports","Email support"] },
  professional: { label:"Professional",  color:"var(--green)",  features:["Unlimited providers","Unlimited claims","Analytics","Priority support","API access"] },
  enterprise:   { label:"Enterprise",    color:"var(--cyan)",   features:["Everything in Pro","Custom integrations","White-label","Dedicated manager","SLA guarantee"] },
};

export default function CompanyPage() {
  const { companyId } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers]     = useState<AppUser[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState<Partial<Company>>({});
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!companyId) return;
    getCompany(companyId).then(c => { setCompany(c); setForm(c||{}); });
    getUsersByCompany(companyId).then(setUsers);
  }, [companyId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    await updateCompany(companyId, form);
    const updated = await getCompany(companyId);
    setCompany(updated); setEditing(false); setSaving(false);
  };

  if (!company) return <div className="dash-content" style={{ textAlign:"center", paddingTop:80, color:"var(--muted)" }}>Loading...</div>;

  const plan = PLAN_INFO[company.plan] || PLAN_INFO.trial;

  return (
    <div className="dash-content">
      <div style={{ marginBottom:28 }}>
        <h1 className="sora" style={{ fontSize:24, fontWeight:800 }}>My Company</h1>
        <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>Manage your company settings and subscription</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Company Details */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Company Details</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>{editing?"Cancel":"Edit"}</button>
            </div>
            <div style={{ padding:24 }}>
              {editing ? (
                <div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">COMPANY NAME</label><input className="form-input" value={form.name||""} onChange={set("name")} /></div>
                    <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email||""} onChange={set("email")} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">PHONE</label><input className="form-input" value={form.phone||""} onChange={set("phone")} /></div>
                    <div className="form-group"><label className="form-label">ADDRESS</label><input className="form-input" value={form.address||""} onChange={set("address")} /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-blue" onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    ["Company Name", company.name],
                    ["Email",        company.email],
                    ["Phone",        company.phone||"—"],
                    ["Address",      company.address||"—"],
                    ["Status",       company.active ? "Active" : "Suspended"],
                  ].map(([k,v]) => (
                    <div className="detail-row" key={k}>
                      <span className="detail-key">{k}</span>
                      <span className="detail-val">{v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Team Summary */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Team ({users.length})</span>
              <a href="/team" className="btn btn-ghost btn-sm">Manage Team →</a>
            </div>
            <div style={{ padding:24 }}>
              {[
                ["Company Admins", users.filter(u => u.role==="company_admin").length],
                ["Billing Staff",  users.filter(u => u.role==="billing_staff").length],
                ["Providers",      users.filter(u => u.role==="provider").length],
                ["Active",         users.filter(u => u.active).length],
              ].map(([k,v],i,arr) => (
                <div className="detail-row" key={String(k)} style={{ borderBottom: i<arr.length-1?"1px solid var(--border)":"none" }}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val" style={{ fontFamily:"Sora,sans-serif", fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Card */}
        <div>
          <div className="data-card" style={{ padding:28 }}>
            <div className="sora" style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Current Plan</div>
            <div style={{ fontSize:28, fontWeight:800, fontFamily:"Sora,sans-serif", color:plan.color, marginBottom:20 }}>{plan.label}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"var(--muted)" }}>
                  <span style={{ color:"var(--green)" }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ background:"rgba(27,111,235,0.08)", border:"1px solid var(--border)", borderRadius:10, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:13, color:"var(--muted)", marginBottom:8 }}>Want to upgrade?</div>
              <a href="mailto:sales@incartbilling.com" className="btn btn-blue btn-sm" style={{ textDecoration:"none" }}>Contact Sales</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
