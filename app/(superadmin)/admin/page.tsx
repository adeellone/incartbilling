"use client";
import { useState } from "react";
import { useReady } from "@/hooks/useReady";
import { useCollection } from "@/hooks/useCollection";
import { addCompany, updateCompany, Company, CompanyPlan } from "@/lib/firestore/companies";
import { AppUser } from "@/lib/firestore/users";
import { Claim } from "@/lib/firestore/claims";
import { Patient } from "@/lib/firestore/patients";
import { Provider } from "@/lib/firestore/providers";

const PB: Record<CompanyPlan, string> = {
  trial: "badge-yellow", starter: "badge-blue",
  professional: "badge-green", enterprise: "badge-cyan",
};

export default function AdminPage() {
  const { ready, isSuperAdmin } = useReady();

  // Real-time listeners — no companyId filter for superadmin
  const { data: companies, loading } = useCollection<Company> ("companies", {});
  const { data: users               } = useCollection<AppUser> ("users",     {});
  const { data: claims              } = useCollection<Claim>   ("claims",    {});
  const { data: patients            } = useCollection<Patient> ("patients",  {});

  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", plan: "trial" as CompanyPlan,
    ownerId: "", address: "", active: true,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await addCompany(form);
    setShowForm(false); setSaving(false);
    setForm({ name: "", email: "", phone: "", plan: "trial", ownerId: "", address: "", active: true });
  };

  if (!ready || !isSuperAdmin) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>Loading platform data...</div>
  );

  return (
    <div className="dash-content">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(27,111,235,0.12)", border: "1px solid var(--border)", borderRadius: 100, padding: "4px 14px", fontSize: 12, color: "var(--cyan)", marginBottom: 12 }}>
          🌐 Super Admin — Full Platform Access
        </div>
        <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>All Companies</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          Complete platform overview
          <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Live
          </span>
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { icon: "🏢", label: "Companies", val: companies.length, color: "var(--blue2)" },
          { icon: "👥", label: "Users",     val: users.length,     color: "var(--white)" },
          { icon: "📋", label: "Claims",    val: claims.length,    color: "var(--cyan)"  },
          { icon: "👤", label: "Patients",  val: patients.length,  color: "var(--green)" },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="sora" style={{ fontSize: 18, fontWeight: 700 }}>Registered Companies</h2>
        <button className="btn btn-blue btn-sm" onClick={() => setShowForm(!showForm)}>+ Add Company</button>
      </div>

      {showForm && (
        <div style={{ marginBottom: 20 }}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">Add Company</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">COMPANY NAME</label><input className="form-input" value={form.name} onChange={set("name")} required /></div>
              <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email} onChange={set("email")} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">PHONE</label><input className="form-input" value={form.phone} onChange={set("phone")} /></div>
              <div className="form-group">
                <label className="form-label">PLAN</label>
                <select className="form-select" value={form.plan} onChange={set("plan")}>
                  {["trial","starter","professional","enterprise"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "Saving..." : "Add Company"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-card">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : companies.length === 0 ? (
          <div className="empty"><div className="empty-icon">🏢</div><div className="empty-title">No companies yet</div></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Company</th><th>Email</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{c.email}</td>
                  <td><span className={`badge ${PB[c.plan]}`}>{c.plan}</span></td>
                  <td><span className={`badge ${c.active ? "badge-green" : "badge-red"}`}>{c.active ? "Active" : "Suspended"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select className="form-select" style={{ width: "auto", fontSize: 12, padding: "4px 8px" }} value={c.plan}
                        onChange={e => updateCompany(c.id!, { plan: e.target.value as CompanyPlan })}>
                        {["trial","starter","professional","enterprise"].map(p => <option key={p}>{p}</option>)}
                      </select>
                      <button className={`btn btn-sm ${c.active ? "btn-danger" : "btn-ghost"}`}
                        onClick={() => updateCompany(c.id!, { active: !c.active })}>
                        {c.active ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
