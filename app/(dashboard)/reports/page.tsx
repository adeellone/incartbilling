"use client";
import { useReady } from "@/hooks/useReady";
import { useCollection } from "@/hooks/useCollection";
import { Claim, ClaimStatus } from "@/lib/firestore/claims";
import { Patient } from "@/lib/firestore/patients";
import { Provider } from "@/lib/firestore/providers";

const SB: Record<string, string> = {
  paid: "badge-green",
  submitted: "badge-blue",
  denied: "badge-red",
  draft: "badge-gray",
  pending: "badge-yellow",
};

export default function ReportsPage() {
  const { ready, queryCompanyId } = useReady();

  const { data: claims, loading: claimsLoading } = useCollection<Claim>("claims", { companyId: queryCompanyId, enabled: ready });
  const { data: patients } = useCollection<Patient>("patients", { companyId: queryCompanyId, enabled: ready });
  const { data: providers } = useCollection<Provider>("providers", { companyId: queryCompanyId, enabled: ready });

  const loading = claimsLoading;

  const totalCharge = claims.reduce((s, c) => s + (c.totalCharge || 0), 0);
  const totalPaid   = claims.reduce((s, c) => s + (c.paidAmount  || 0), 0);
  const balance     = totalCharge - totalPaid;
  const rate        = totalCharge > 0 ? ((totalPaid / totalCharge) * 100).toFixed(1) : "0.0";
  const denied      = claims.filter(c => c.status === "denied");
  const denialRate  = claims.length > 0 ? ((denied.length / claims.length) * 100).toFixed(1) : "0.0";
  const fmt         = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const byStatus    = (s: ClaimStatus) => claims.filter(c => c.status === s);

  const byProvider = claims.reduce<Record<string, { name: string; count: number; charge: number; paid: number }>>((acc, c) => {
    if (!c.providerName) return acc;
    if (!acc[c.providerName]) acc[c.providerName] = { name: c.providerName, count: 0, charge: 0, paid: 0 };
    acc[c.providerName].count++;
    acc[c.providerName].charge += (c.totalCharge || 0);
    acc[c.providerName].paid   += (c.paidAmount  || 0);
    return acc;
  }, {});

  const topProviders = Object.values(byProvider).sort((a, b) => b.charge - a.charge).slice(0, 5);
  const maxCharge    = Math.max(...topProviders.map(p => p.charge), 1);

  if (!ready) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>Loading...</div>
  );

  return (
    <div className="dash-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Reports & Analytics</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Revenue cycle performance</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,138,0.1)", border: "1px solid rgba(0,212,138,0.25)", borderRadius: 100, padding: "5px 12px", fontSize: 12, color: "var(--green)" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
          Live
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 64, color: "var(--muted)" }}>Loading reports...</div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {[
              { icon: "💰", label: "Total Charges",   val: fmt(totalCharge), color: "var(--white)"  },
              { icon: "✅", label: "Total Collected",  val: fmt(totalPaid),   color: "var(--green)"  },
              { icon: "⚖️", label: "Outstanding",      val: fmt(balance),     color: "var(--yellow)" },
              { icon: "📈", label: "Collection Rate",  val: `${rate}%`,       color: "var(--blue2)"  },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-val" style={{ fontSize: 22, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div className="data-card" style={{ padding: 24 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Claims Summary</div>
              {[
                { label: "Total Claims", val: claims.length,           color: "var(--white)"  },
                { label: "Paid",         val: byStatus("paid").length,  color: "var(--green)"  },
                { label: "Submitted",    val: byStatus("submitted").length, color: "var(--blue2)" },
                { label: "Denied",       val: denied.length,            color: "var(--red)"    },
                { label: "Draft",        val: byStatus("draft").length, color: "var(--muted)"  },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "Sora,sans-serif", color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>

            <div className="data-card" style={{ padding: 24 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Performance</div>
              {[
                { label: "Denial Rate",      val: `${denialRate}%`, target: "< 5%",  good: parseFloat(denialRate) < 5   },
                { label: "Collection Rate",  val: `${rate}%`,       target: "> 95%", good: parseFloat(rate) > 95        },
                { label: "Active Patients",  val: patients.length,  target: "—",     good: true                         },
                { label: "Active Providers", val: providers.length, target: "—",     good: true                         },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
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

          {topProviders.length > 0 && (
            <div className="data-card" style={{ padding: 24, marginBottom: 24 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Revenue by Provider</div>
              {topProviders.map((p, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ color: "var(--muted)", fontSize: 13 }}>{p.count} claims</span>
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>{fmt(p.paid)}</span>
                      <span style={{ fontWeight: 700 }}>{fmt(p.charge)}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(p.charge / maxCharge) * 100}%`, background: "var(--blue)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Claims by Status</span>
            </div>
            {claims.length === 0 ? (
              <div className="empty"><div className="empty-icon">📊</div><div className="empty-title">No data yet</div></div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Status</th><th>Count</th><th>Charge</th><th>Paid</th><th>Rate</th></tr></thead>
                <tbody>
                  {(["paid", "submitted", "pending", "denied", "draft"] as ClaimStatus[]).map(s => {
                    const sc = byStatus(s);
                    const ch = sc.reduce((a, c) => a + (c.totalCharge || 0), 0);
                    const pd = sc.reduce((a, c) => a + (c.paidAmount  || 0), 0);
                    return (
                      <tr key={s}>
                        <td><span className={`badge ${SB[s]}`}>{s}</span></td>
                        <td style={{ fontWeight: 700 }}>{sc.length}</td>
                        <td>{fmt(ch)}</td>
                        <td style={{ color: "var(--green)" }}>{fmt(pd)}</td>
                        <td>{ch > 0 ? ((pd / ch) * 100).toFixed(0) : 0}%</td>
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
