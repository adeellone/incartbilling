"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import { useReady } from "@/hooks/useReady";
import { useAuth } from "@/context/AuthContext";
import { useClaimHistory } from "@/hooks/useClaimHistory";
import { updateClaim, Claim, ClaimStatus } from "@/lib/firestore/claims";
import { addClaimHistory, ACTION_META, formatHistoryTime } from "@/lib/firestore/claimHistory";
import { notify } from "@/lib/firestore/notifications";

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-green", submitted: "badge-blue",
  denied: "badge-red", draft: "badge-gray", pending: "badge-yellow",
};
const STATUSES: ClaimStatus[] = ["draft", "submitted", "pending", "paid", "denied"];

export default function ClaimDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { ready, queryCompanyId, companyId, profile } = useReady();
  const { user } = useAuth();

  const { data: claims } = useCollection<Claim>("claims", {
    companyId: queryCompanyId, enabled: ready,
  });
  const claim = claims.find(c => c.id === id) ?? null;

  // ── Audit trail ──────────────────────────────────────────────────────────
  const { history, loading: historyLoading } = useClaimHistory(id);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [paidAmount,     setPaidAmount]     = useState("");
  const [showPayment,    setShowPayment]    = useState(false);
  const [activeTab,      setActiveTab]      = useState<"details" | "history">("details");

  const userName = profile?.displayName ?? "Unknown User";
  const userId   = user?.uid ?? "";

  // ── Status change with audit entry ───────────────────────────────────────
  const handleStatus = async (newStatus: ClaimStatus) => {
    if (!id || !claim) return;
    setUpdatingStatus(true);

    const oldStatus = claim.status;
    await updateClaim(id, { status: newStatus });

    // Audit entry
    await addClaimHistory(id, {
      action: "status_changed",
      label: `Status changed from ${oldStatus} to ${newStatus}`,
      field: "status",
      oldValue: oldStatus,
      newValue: newStatus,
      userId,
      userName,
    });

    // Notification
    if (companyId) {
      await notify.claimStatusChanged(companyId, claim.patientName, newStatus, id);
    }

    setUpdatingStatus(false);
  };

  // ── Payment post with audit entry ────────────────────────────────────────
  const handlePayment = async () => {
    if (!id || !claim) return;
    const amount = parseFloat(paidAmount) || 0;

    await updateClaim(id, { paidAmount: amount, status: "paid" });

    // Audit entry
    await addClaimHistory(id, {
      action: "payment_posted",
      label: `Payment of $${amount.toFixed(2)} posted`,
      field: "paidAmount",
      oldValue: `$${(claim.paidAmount || 0).toFixed(2)}`,
      newValue: `$${amount.toFixed(2)}`,
      userId,
      userName,
    });

    // Notification
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
      {/* Header */}
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
        <span className={`badge ${STATUS_BADGE[claim.status] || "badge-gray"}`} style={{ fontSize: 13, padding: "6px 14px" }}>
          {claim.status}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {(["details", "history"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--blue)" : "2px solid transparent",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "var(--white)" : "var(--muted)",
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: -1,
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}
          >
            {tab === "history" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                History
                {history.length > 0 && (
                  <span style={{ background: "var(--blue)", color: "#fff", borderRadius: 100, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
                    {history.length}
                  </span>
                )}
              </span>
            ) : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="detail-grid">
          {/* Left */}
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

          {/* Right */}
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
                <button className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => setActiveTab("history")}>📋 View History ({history.length})</button>
                <button className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => window.print()}>🖨️ Print Claim</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div style={{ maxWidth: 760 }}>
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Audit Trail</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{history.length} events</span>
            </div>

            {historyLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No history yet</div>
                <div className="empty-sub">Events will appear here as the claim progresses</div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {history.map((entry, idx) => {
                  const meta = ACTION_META[entry.action] || ACTION_META.field_edited;
                  const isLast = idx === history.length - 1;
                  return (
                    <div key={entry.id} style={{ display: "flex", gap: 16, padding: "0 24px" }}>
                      {/* Timeline line + icon */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: meta.bg,
                          border: `2px solid ${meta.color}33`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          flexShrink: 0,
                          zIndex: 1,
                        }}>
                          {meta.icon}
                        </div>
                        {!isLast && (
                          <div style={{ width: 2, flex: 1, background: "var(--border)", margin: "4px 0" }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: isLast ? 24 : 20, paddingTop: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--white)" }}>
                            {entry.label}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, marginLeft: 12 }}>
                            {formatHistoryTime(entry.timestamp)}
                          </span>
                        </div>

                        {/* Old → New value diff */}
                        {(entry.oldValue || entry.newValue) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            {entry.oldValue && (
                              <span style={{
                                fontSize: 12,
                                background: "rgba(255,77,106,0.1)",
                                color: "var(--red)",
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontFamily: "monospace",
                                textDecoration: "line-through",
                                opacity: 0.8,
                              }}>
                                {entry.oldValue}
                              </span>
                            )}
                            {entry.oldValue && entry.newValue && (
                              <span style={{ fontSize: 12, color: "var(--muted)" }}>→</span>
                            )}
                            {entry.newValue && (
                              <span style={{
                                fontSize: 12,
                                background: "rgba(0,212,138,0.1)",
                                color: "var(--green)",
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontFamily: "monospace",
                              }}>
                                {entry.newValue}
                              </span>
                            )}
                          </div>
                        )}

                        {/* User */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#fff",
                          }}>
                            {entry.userName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {entry.userName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export audit trail */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const rows = [
                  ["Time", "Action", "Label", "Old Value", "New Value", "User"].join(","),
                  ...history.map(e => [
                    formatHistoryTime(e.timestamp),
                    e.action,
                    `"${e.label}"`,
                    e.oldValue || "",
                    e.newValue || "",
                    e.userName,
                  ].join(","))
                ].join("\n");
                const blob = new Blob([rows], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `claim-history-${id}.csv`;
                a.click();
              }}
            >
              ⬇️ Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
