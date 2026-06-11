"use client";
import { useReady } from "@/hooks/useReady";
import { useCollection } from "@/hooks/useCollection";
import { Timestamp } from "firebase/firestore";

interface Payment {
  id?: string;
  companyId: string;
  claimId: string;
  patientName: string;
  amount: number;
  type: string;
  method: string;
  postedAt?: Timestamp;
}

export default function ProviderPaymentsPage() {
  const { ready, queryCompanyId } = useReady();

  const { data: payments, loading } = useCollection<Payment>("payments", {
    companyId: queryCompanyId,
    orderByField: "postedAt",
  });

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  if (!ready) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>Loading...</div>
  );

  return (
    <div className="dash-content">
      <div style={{ marginBottom: 28 }}>
        <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>My Payments</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          Payments collected on your behalf
          <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Live
          </span>
        </p>
      </div>

      <div className="stat-card" style={{ maxWidth: 240, marginBottom: 24 }}>
        <div className="stat-card-label">Total Collected</div>
        <div className="stat-card-val" style={{ color: "var(--green)" }}>${total.toFixed(2)}</div>
      </div>

      <div className="data-card">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : payments.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">💰</div>
            <div className="empty-title">No payments yet</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Patient</th><th>Amount</th><th>Type</th><th>Method</th></tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.patientName || "—"}</td>
                  <td style={{ color: "var(--green)", fontWeight: 700 }}>${(p.amount || 0).toFixed(2)}</td>
                  <td><span className={`badge ${p.type === "insurance" ? "badge-blue" : "badge-green"}`}>{p.type}</span></td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
