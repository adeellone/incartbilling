"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClaims, Claim } from "@/lib/firestore/claims";

const STATUS_BADGE: Record<string, string> = {
  paid:"badge-green", submitted:"badge-blue",
  denied:"badge-red", draft:"badge-gray", pending:"badge-yellow",
};

export default function ProviderClaimsPage() {
  const { user, profile } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getClaims().then(all => {
      const mine = all.filter(c =>
        profile?.providerClientId
          ? c.providerId === profile.providerClientId
          : c.providerName?.toLowerCase().includes((user?.displayName||"").toLowerCase())
      );
      setClaims(mine); setLoading(false);
    });
  }, [profile, user]);

  const filtered = filter === "all" ? claims : claims.filter(c => c.status === filter);
  const fmt = (n: number) => "$" + (n||0).toFixed(2);

  return (
    <div className="dash-content">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 className="sora" style={{ fontSize:24, fontWeight:800 }}>My Claims</h1>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>Read-only view of your claims</p>
        </div>
        <select className="form-select" style={{ width:"auto" }} value={filter} onChange={e => setFilter(e.target.value)}>
          {["all","draft","submitted","pending","paid","denied"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="data-card">
        {loading ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>Loading claims...</div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No claims</div></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Service Date</th><th>Diagnosis</th><th>Charge</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontSize:13 }}>{c.serviceDate}</td>
                  <td style={{ fontFamily:"monospace", fontSize:12, color:"var(--muted)" }}>{c.diagnosisCodes?.slice(0,2).join(", ")||"—"}</td>
                  <td style={{ fontWeight:600 }}>{fmt(c.totalCharge||0)}</td>
                  <td style={{ color:"var(--green)" }}>{fmt(c.paidAmount||0)}</td>
                  <td style={{ color:"var(--yellow)" }}>{fmt((c.totalCharge||0)-(c.paidAmount||0))}</td>
                  <td><span className={`badge ${STATUS_BADGE[c.status]||"badge-gray"}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
