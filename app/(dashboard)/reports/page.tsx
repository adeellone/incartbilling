"use client";
import { useEffect, useState } from "react";
import { getClaims, Claim, ClaimStatus } from "@/lib/firestore/claims";
import { getPatients } from "@/lib/firestore/patients";
import { getProviders } from "@/lib/firestore/providers";

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-green", submitted: "badge-blue",
  denied: "badge-red", draft: "badge-gray", pending: "badge-yellow",
};

export default function ReportsPage() {
  const [claims, setClaims]             = useState<Claim[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([getClaims(), getPatients(), getProviders()]).then(([c, p, pr]) => {
      setClaims(c); setPatientCount(p.length); setProviderCount(pr.length);
      setLoading(false);
    });
  }, []);

  const totalCharge  = claims.reduce((s, c) => s + (c.totalCharge  || 0), 0);
  const totalPaid    = claims.reduce((s, c) => s + (c.paidAmount   || 0), 0);
  const totalBalance = totalCharge - totalPaid;
  const collectionRate = totalCharge > 0 ? ((totalPaid / totalCharge) * 100).toFixed(1) : "0.0";

  const byStatus = (s: ClaimStatus) => claims.filter(c => c.status === s);
  const paidClaims    = byStatus("paid");
  const deniedClaims  = byStatus("denied");
  const pendingClaims = byStatus("submitted");

  const denialRate = claims.length > 0 ? ((deniedClaims.length / claims.length) * 100).toFixed(1) : "0.0";

  const byProvider = claims.reduce<Record<string, { name: string; count: number; charge: number; paid: number }>>((acc, c) => {
    if (!c.providerName) return acc;
    if (!acc[c.providerName]) acc[c.providerName] = { name: c.providerName, count: 0, charge: 0, paid: 0 };
    acc[c.providerName].count++;
    acc[c.providerName].charge += c.totalCharge || 0;
    acc[c.providerName].paid   += c.paidAmount  || 0;
    return acc;
  }, {});

  const topProviders = Object.values(byProvider).sort((a, b) => b.charge - a.charge).slice(0, 5);

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );

  const maxCharge = Math.max(...topProviders.map(p => p.charge), 1);

  return (
    <div className="dash-content">
      <div style={{ marginBottom: 28 }}>
        <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Reports & Analytics</h1>
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>Revenue cycle performance overview</div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 64, color: "var(--muted)" }}>Loading reports...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {[
              { icon: "💰", label: "Total Charges",    val: fmt(totalCharge),      color: "var(--white)"  },
              { icon: "✅", label: "Total Collected",  val: fmt(totalPaid),         color: "var(--green)"  },
              { icon: "⚖️", label: "Outstanding Balance", val: fmt(totalBalance),  color: "var(--yellow)" },
              { icon: "📈", label: "Collection Rate",  val: `${collectionRate}%`,   color: "var(--blue2)"  },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-val" style={{ fontSize: 26, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

            {/* Claims Summary */}
            <div className="data-card" style={{ padding: 24 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Claims Summary</div>
              {[
                { label: "Total Claims",    val: claims.length,         color: "var(--white)"  },
                { label: "Paid",            val: paidClaims.length,     color: "var(--green)"  },
                { label: "Submitted",       val: pendingClaims.length,  color: "var(--blue2)"  },
                { label: "Denied",          val: deniedClaims.length,   color: "var(--red)"    },
                { label: "Draft",           val: byStatus("draft").length, color: "var(--muted)" },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "Sora, sans-serif", color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Performance Metrics */}
            <div className="data-card" style={{ padding: 24 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Performance Metrics</div>
              {[
                { label: "Denial Rate",        val: `${denialRate}%`,       target: "< 5%",   good: parseFloat(denialRate) < 5 },
                { label: "Collection Rate",    val: `${collectionRate}%`,   target: "> 95%",  good: parseFloat(collectionRate) > 95 },
                { label: "Active Patients",    val: patientCount,           target: "—",      good: true },
                { label: "Active Providers",   val: providerCount,          target: "—",      good: true },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Target: {r.target}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: r.good ? "var(--green)" : "var(--red)" }}>{r.val}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Providers */}
          {topProviders.length > 0 && (
            <div className="data-card" style={{ padding: 24, marginBottom: 24 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Revenue by Provider</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {topProviders.map((p, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>{p.count} claims</span>
                        <span style={{ color: "var(--green)", fontWeight: 600 }}>{fmt(p.paid)} paid</span>
                        <span style={{ fontWeight: 700 }}>{fmt(p.charge)}</span>
                      </div>
                    </div>
                    <Bar value={p.charge} max={maxCharge} color="var(--blue)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Breakdown */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Claims by Status</span>
            </div>
            {claims.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📊</div>
                <div className="empty-title">No data yet</div>
                <div className="empty-sub">Create claims to see analytics</div>
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Status</th><th>Count</th><th>Total Charge</th><th>Total Paid</th><th>Collection Rate</th></tr></thead>
                <tbody>
                  {(["paid","submitted","pending","denied","draft"] as ClaimStatus[]).map(s => {
                    const sc = byStatus(s);
                    const charge = sc.reduce((a, c) => a + (c.totalCharge || 0), 0);
                    const paid   = sc.reduce((a, c) => a + (c.paidAmount  || 0), 0);
                    const rate   = charge > 0 ? ((paid / charge) * 100).toFixed(0) : "0";
                    return (
                      <tr key={s}>
                        <td><span className={`badge ${STATUS_BADGE[s]}`}>{s}</span></td>
                        <td style={{ fontWeight: 700 }}>{sc.length}</td>
                        <td>{fmt(charge)}</td>
                        <td style={{ color: "var(--green)" }}>{fmt(paid)}</td>
                        <td>{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
