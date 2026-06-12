"use client";
import { useAuth } from "@/context/AuthContext";
import { useReady } from "@/hooks/useReady";
import { useCollection } from "@/hooks/useCollection";
import { Claim } from "@/lib/firestore/claims";
import { Patient } from "@/lib/firestore/patients";
import { Provider } from "@/lib/firestore/providers";

const SB: Record<string, string> = {
  paid: "badge-green",
  submitted: "badge-blue",
  denied: "badge-red",
  draft: "badge-gray",
  pending: "badge-yellow",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { ready, queryCompanyId } = useReady();

  // ── Real-time listeners ──────────────────────────────────────────
  const { data: claims, loading: claimsLoading } = useCollection<Claim>(
    "claims",
    { companyId: queryCompanyId, enabled: ready }
  );
  const { data: patients, loading: patientsLoading } = useCollection<Patient>(
    "patients",
    { companyId: queryCompanyId, enabled: ready }
  );
  const { data: providers, loading: providersLoading } =
    useCollection<Provider>("providers", { companyId: queryCompanyId, enabled: ready });

  const loading = claimsLoading || patientsLoading || providersLoading;

  // ── Derived stats ────────────────────────────────────────────────
  const totalCharge = claims.reduce((s, c) => s + (c.totalCharge || 0), 0);
  const totalPaid = claims.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const denied = claims.filter((c) => c.status === "denied").length;
  const submitted = claims.filter((c) => c.status === "submitted").length;

  const fmt = (n: number) =>
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  if (!ready)
    return (
      <div
        className="dash-content"
        style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}
      >
        Loading...
      </div>
    );

  return (
    <div className="dash-content">
      {/* Live indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            className="sora"
            style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}
          >
            {greet()}, {user?.displayName?.split(" ")[0] || "there"} 👋
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* Real-time badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0,212,138,0.1)",
            border: "1px solid rgba(0,212,138,0.25)",
            borderRadius: 100,
            padding: "5px 12px",
            fontSize: 12,
            color: "var(--green)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              boxShadow: "0 0 6px var(--green)",
              animation: "pulse 2s infinite",
            }}
          />
          Live
        </div>
      </div>

      <div className="stat-grid">
        {[
          {
            icon: "📋",
            label: "Total Claims",
            val: loading ? "—" : claims.length,
            sub: `${submitted} pending`,
            color: "#3D8EFF",
          },
          {
            icon: "💰",
            label: "Total Charges",
            val: loading ? "—" : fmt(totalCharge),
            sub: `${fmt(totalPaid)} collected`,
            color: "#00D48A",
          },
          {
            icon: "👤",
            label: "Patients",
            val: loading ? "—" : patients.length,
            sub: "registered",
            color: "#00D4FF",
          },
          {
            icon: "🚫",
            label: "Denied",
            val: loading ? "—" : denied,
            sub: "require attention",
            color: "#FF4D6A",
          },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          marginTop: 24,
        }}
      >
        <div className="data-card">
          <div className="data-card-header">
            <span className="data-card-title sora">Recent Claims</span>
            <a href="/claims" className="btn btn-ghost btn-sm">
              View all →
            </a>
          </div>
          {loading ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              Loading...
            </div>
          ) : claims.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No claims yet</div>
              <a href="/claims/new" className="btn btn-blue btn-sm">
                New Claim
              </a>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Provider</th>
                  <th>Date</th>
                  <th>Charge</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <a href={`/claims/${c.id}`} className="tbl-link">
                        {c.patientName}
                      </a>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>
                      {c.providerName}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>
                      {c.serviceDate}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${(c.totalCharge || 0).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge ${SB[c.status] || "badge-gray"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="data-card" style={{ padding: 24 }}>
            <div
              className="sora"
              style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}
            >
              Quick Actions
            </div>
            {[
              {
                href: "/claims/new",
                icon: "📋",
                label: "New Claim",
                sub: "Submit a claim",
              },
              {
                href: "/patients",
                icon: "👤",
                label: "Add Patient",
                sub: "Register patient",
              },
              {
                href: "/providers",
                icon: "🏥",
                label: "Add Provider",
                sub: "Add provider",
              },
              {
                href: "/reports",
                icon: "📈",
                label: "Reports",
                sub: "View analytics",
              },
            ].map((a, i) => (
              <a
                key={i}
                href={a.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < 3 ? "1px solid var(--border)" : "none",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(27,111,235,0.12)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {a.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--white)",
                    }}
                  >
                    {a.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {a.sub}
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="data-card" style={{ padding: 24 }}>
            <div
              className="sora"
              style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}
            >
              Summary
            </div>
            {[
              { label: "Patients", val: patients.length },
              { label: "Providers", val: providers.length },
              {
                label: "Paid",
                val: claims.filter((c) => c.status === "paid").length,
              },
              { label: "Submitted", val: submitted },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  {r.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {loading ? "—" : r.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
