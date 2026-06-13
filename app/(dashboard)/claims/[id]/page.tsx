"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import { useReady } from "@/hooks/useReady";
import { updateClaim, Claim, ClaimStatus } from "@/lib/firestore/claims";
import { notify } from "@/lib/firestore/notifications";

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-green", submitted: "badge-blue",
  denied: "badge-red", draft: "badge-gray", pending: "badge-yellow",
};
const STATUSES: ClaimStatus[] = ["draft", "submitted", "pending", "paid", "denied"];

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { ready, queryCompanyId, companyId } = useReady();

  const { data: claims } = useCollection<Claim>("claims", {
    companyId: queryCompanyId,
    enabled: ready,
  });
  const claim = claims.find(c => c.id === id) ?? null;

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [paidAmount,     setPaidAmount]     = useState("");
  const [showPayment,    setShowPayment]    = useState(false);

  const handleStatus = async (status: ClaimStatus) => {
    if (!id || !claim) return;
    setUpdatingStatus(true);
    await updateClaim(id, { status });
    // 🔔 Notify on status change
    if (companyId) {
      await notify.claimStatusChanged(companyId, claim.patientName, status, id);
    }
    setUpdatingStatus(false);
  };

  const handlePayment = async () => {
    if (!id || !claim) return;
    const amount = parseFloat(paidAmount) || 0;
    await updateClaim(id, { paidAmount: amount, status: "paid" });
    // 🔔 Notify payment posted
    if (companyId) {
      await notify.paymentPosted(companyId, claim.patientName, amount, id);
    }
    setShowPayment(false);
    setPaidAmount("");
  };

  if (!ready) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>Loading...</div>
  );

  if (!claim) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>
      Claim not found or loading...
    </div>
  );

  return (
    <div className="dash-content">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/claims")}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 className="sora" style={{ fontSize: 22, fontWeight: 800 }}>Claim — {claim.patientName}</h1>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
            ID: {id}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              Live
            </span>
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[claim.status] || "badge-gray"}`} style={{ fontSize: 13, padding: "6px 14px" }}>{claim.status}</span>
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="data-card">
            <div className="data-card-header"><span className="data-card-title sora">Claim Details</span></div>
            <div style={{ padding: 24 }}>
              {[
                ["Patient",      claim.patientName],
                ["Provider",     claim.providerName],
                ["Service Date", claim.serviceDate],
                ["Total Charge", `$${(claim.totalCharge || 0).toFixed(2)}`],
                ["Amount Paid",  `$${(claim.paidAmount  || 0).toFixed(2)}`],
                ["Balance",      `$${((claim.totalCharge || 0) - (claim.paidAmount || 0)).toFixed(2)}`],
                ["Notes",        claim.notes || "—"],
              ].map(([k, v]) => (
                <div className="detail-row" key={k}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val" style={{
                    color: k === "Balance" && ((claim.totalCharge || 0) - (claim.paidAmount || 0)) > 0 ? "var(--yellow)" : undefined
                  }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header"><span className="data-card-title sora">Diagnosis Codes (ICD-10)</span></div>
            <div style={{ padding: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {claim.diagnosisCodes?.length
                ? claim.diagnosisCodes.map(dx => (
                    <span key={dx} className="badge badge-blue" style={{ fontFamily: "monospace", fontSize: 13 }}>{dx}</span>
                  ))
                : <span style={{ color: "var(--muted)", fontSize: 13 }}>No diagnosis codes</span>}
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header"><span className="data-card-title sora">Procedure Codes (CPT)</span></div>
            {claim.procedureCodes?.length ? (
              <table className="tbl">
                <thead><tr><th>CPT Code</th><th>Description</th><th>Units</th><th>Charge</th><th>Total</th></tr></thead>
                <tbody>
                  {claim.procedureCodes.map((cpt, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{cpt.code}</td>
                      <td style={{ color: "var(--muted)", fontSize: 13 }}>{cpt.description}</td>
                      <td>{cpt.units}</td>
                      <td>${(cpt.charge || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${((cpt.charge || 0) * (cpt.units || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 24, color: "var(--muted)", fontSize: 13 }}>No procedure codes</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="data-card" style={{ padding: 24 }}>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Update Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s}
                  className={`btn ${claim.status === s ? "btn-blue" : "btn-ghost"}`}
                  style={{ justifyContent: "flex-start", textTransform: "capitalize" }}
                  onClick={() => handleStatus(s)}
                  disabled={updatingStatus || claim.status === s}>
                  <span className={`badge ${STATUS_BADGE[s]}`} style={{ fontSize: 11 }}>{s}</span>
                  {claim.status === s && " ← current"}
                </button>
              ))}
            </div>
          </div>

          <div className="data-card" style={{ padding: 24 }}>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Post Payment</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
              Remaining: <strong style={{ color: "var(--yellow)" }}>
                ${((claim.totalCharge || 0) - (claim.paidAmount || 0)).toFixed(2)}
              </strong>
            </div>
            {showPayment ? (
              <div>
                <div className="form-group">
                  <label className="form-label">PAYMENT AMOUNT</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0.00"
                    value={paidAmount} onChange={e => setPaidAmount(e.target.value)} autoFocus />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn btn-blue btn-sm" onClick={handlePayment}>Post Payment</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowPayment(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-blue btn-full" onClick={() => setShowPayment(true)}>💰 Post Payment</button>
            )}
          </div>

          <div className="data-card" style={{ padding: 24 }}>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={`/patients/${claim.patientId}`} className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>👤 View Patient</a>
              <button className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => window.print()}>🖨️ Print Claim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
