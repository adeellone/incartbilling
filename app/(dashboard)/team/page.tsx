"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUsersByCompany, updateUserProfile, AppUser, UserRole } from "@/lib/firestore/users";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/firestore/users";

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin:    "badge-cyan",
  company_admin: "badge-blue",
  billing_staff: "badge-gray",
  provider:      "badge-green",
};

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin:    "Super Admin",
  company_admin: "Company Admin",
  billing_staff: "Billing Staff",
  provider:      "Provider (read-only)",
};

export default function TeamPage() {
  const { companyId } = useAuth();
  const [users, setUsers]     = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"billing_staff" as UserRole });
  const [error, setError]     = useState("");

  const load = async () => {
    if (!companyId) return;
    const u = await getUsersByCompany(companyId);
    setUsers(u); setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async (e: React.FormEvent) => {
  e.preventDefault(); setError(""); setSaving(true);
  try {
    // Secondary app — does NOT replace your session
    const { initializeApp, deleteApp } = await import("firebase/app");
    const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");

    const secondaryApp  = initializeApp(
      (await import("@/lib/firebase")).auth.app.options,
      "secondary-" + Date.now()
    );
    const secondaryAuth = getAuth(secondaryApp);

    const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
    await updateProfile(cred.user, { displayName: form.name });
    await createUserProfile(cred.user.uid, {
      email: form.email, displayName: form.name,
      role: form.role, companyId: companyId!, active: true,
    });

    await deleteApp(secondaryApp); // cleanup
    setForm({ name:"", email:"", password:"", role:"billing_staff" });
    setShowForm(false); load();
  } catch (err: unknown) {
    setError((err as { message?: string }).message || "Failed to create user");
  } finally { setSaving(false); }
};

  return (
    <div className="dash-content">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 className="sora" style={{ fontSize:24, fontWeight:800 }}>Team Members</h1>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>{users.length} members in your company</p>
        </div>
        <button className="btn btn-blue" onClick={() => setShowForm(!showForm)}>+ Invite Member</button>
      </div>

      {showForm && (
        <div style={{ marginBottom:24 }}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">Invite Team Member</div>
            {error && <div className="err">⚠️ {error}</div>}
            <div className="form-row">
              <div className="form-group"><label className="form-label">FULL NAME</label><input className="form-input" value={form.name} onChange={set("name")} required /></div>
              <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email} onChange={set("email")} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">TEMP PASSWORD</label><input className="form-input" type="password" placeholder="Min 6 chars" value={form.password} onChange={set("password")} required /></div>
              <div className="form-group">
                <label className="form-label">ROLE</label>
                <select className="form-select" value={form.role} onChange={set("role")}>
                  <option value="billing_staff">Billing Staff</option>
                  <option value="company_admin">Company Admin</option>
                  <option value="provider">Provider (read-only)</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "Creating..." : "Create Member"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">Team ({users.length})</span></div>
        {loading ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>Loading team...</div>
        ) : users.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No team members yet</div>
            <div className="empty-sub">Invite your billing staff to get started</div>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:600 }}>{u.displayName}</td>
                  <td style={{ color:"var(--muted)", fontSize:13 }}>{u.email}</td>
                  <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                  <td><span className={`badge ${u.active ? "badge-green" : "badge-red"}`}>{u.active ? "Active" : "Inactive"}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.active ? "btn-danger" : "btn-ghost"}`}
                      onClick={() => { updateUserProfile(u.uid, { active: !u.active }); load(); }}>
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
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
