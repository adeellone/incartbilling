"use client";
import { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { updateUserProfile, AppUser, UserRole } from "@/lib/firestore/users";
import { Company } from "@/lib/firestore/companies";

const RB: Record<UserRole, string> = {
  superadmin: "badge-cyan", company_admin: "badge-blue",
  billing_staff: "badge-gray", provider: "badge-green",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  // Real-time listeners — no companyId filter for superadmin
  const { data: users,     loading } = useCollection<AppUser>("users", { enabled: true });
  const { data: companies           } = useCollection<Company>("companies", { enabled: true });

  const companyName = (id: string) => companies.find(c => c.id === id)?.name || id;

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-content">
      <div style={{ marginBottom: 28 }}>
        <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>All Users</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          {users.length} users across all companies
          <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Live
          </span>
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">Users ({filtered.length})</span></div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.displayName}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontSize: 13 }}>{companyName(u.companyId)}</td>
                  <td><span className={`badge ${RB[u.role]}`}>{u.role.replace("_", " ")}</span></td>
                  <td><span className={`badge ${u.active ? "badge-green" : "badge-red"}`}>{u.active ? "Active" : "Inactive"}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.active ? "btn-danger" : "btn-ghost"}`}
                      onClick={() => updateUserProfile(u.uid, { active: !u.active })}>
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
