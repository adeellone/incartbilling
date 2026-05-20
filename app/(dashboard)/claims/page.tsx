"use client";
import { useEffect, useState } from "react";
import { getClaims, deleteClaim, Claim, ClaimStatus } from "@/lib/firestore/claims";

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-green", submitted: "badge-blue",
  denied: "badge-red", draft: "badge-gray", pending: "badge-yellow",
};

const STATUSES: (ClaimStatus | "all")[] = ["all", "draft", "submitted", "pending", "paid", "denied"];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filtered, setFiltered] = useState<Claim[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClaimStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = () => getClaims().then((c) => { setClaims(c); setLoading(false); });
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(claims.filter((c) => {
      const matchSearch = c.patientName?.toLowerCase().includes(q) || c.providerName?.toLowerCase().includes(q);
      const matchStatus = status === "all" || c.status === status;
      return matchSearch && matchStatus;
    }));
  }, [search, status, claims]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this claim?")) return;
    await deleteClaim(id); load();
  };

  const totalCharge = filtered.reduce((s, c) => s + (c.totalCharge || 0), 0);
  const totalPaid   = filtered.reduce((s, c) => s + (c.paidAmount  || 0), 0);

  return (
    <div className="dash-content">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Claims</h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{claims.length} total claims</div>
        </div>
        <a href="/claims/new" className="btn btn-blue">+ New Claim</a>
      </div>

      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {STATUSES.filter(s => s !== "all").map((s) => {
          const count = claims.filter(c => c.status === s).length;
          return (
            <div key={s} className="stat-card" style={{ padding: 16, cursor: "pointer", borderColor: status === s ? "var(--blue)" : undefined }}
              onClick={() => setStatus(status === s ? "all" : s)}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Sora, sans-serif" }}>{count}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, textTransform: "capitalize" }}>{s}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="search-bar">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input placeholder="Search by patient or provider..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: "auto", minWidth: 140 }} value={status} onChange={(e) => setStatus(e.target.value as ClaimStatus | "all")}>
          {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">{filtered.length} Claims</span>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Charges: <strong style={{ color: "var(--white)" }}>${totalCharge.toFixed(2)}</strong>
            &nbsp;·&nbsp; Paid: <strong style={{ color: "var(--green)" }}>${totalPaid.toFixed(2)}</strong>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading claims...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No claims found</div>
            <div className="empty-sub">Create your first claim to start billing</div>
            <a href="/claims/new" className="btn btn-blue btn-sm">New Claim</a>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Patient</th><th>Provider</th><th>Service Date</th><th>Codes</th><th>Charge</th><th>Paid</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><a href={`/claims/${c.id}`} className="tbl-link">{c.patientName}</a></td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{c.providerName}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{c.serviceDate}</td>
                  <td style={{ fontSize: 12, fontFamily: "monospace", color: "var(--muted)" }}>
                    {c.diagnosisCodes?.slice(0, 2).join(", ") || "—"}
                  </td>
                  <td style={{ fontWeight: 600 }}>${(c.totalCharge || 0).toFixed(2)}</td>
                  <td style={{ color: "var(--green)", fontWeight: 600 }}>${(c.paidAmount || 0).toFixed(2)}</td>
                  <td><span className={`badge ${STATUS_BADGE[c.status] || "badge-gray"}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`/claims/${c.id}`} className="btn btn-ghost btn-sm">View</a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id!)}>Del</button>
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
