"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClaims, Claim } from "@/lib/firestore/claims";

const STATUS_BADGE: Record<string, string> = {
  paid:"badge-green", submitted:"badge-blue",
  denied:"badge-red", draft:"badge-gray", pending:"badge-yellow",
};

export default function ProviderPortalPage() {
  const { user, profile } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClaims().then(all => {
      // Provider sees only their own claims
      const mine = all.filter(c =>
        profile?.providerClientId
          ? c.providerId === profile.providerClientId
          : c.providerName?.toLowerCase().includes((user?.displayName || "").toLowerCase())
      );
      setClaims(mine); setLoading(false);
    });
  }, [profile, user]);

  const totalCharge = claims.reduce((s, c) => s + (c.totalCharge || 0), 0);
  const totalPaid   = claims.reduce((s, c) => s + (c.paidAmount  || 0), 0);
  const balance     = totalCharge - totalPaid;
  const paid        = claims.filter(c => c.status === "paid").length;
  const denied      = claims.filter(c => c.status === "denied").length;
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });

  return (
    <div className="dash-content">
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(0,212,138,0.1)", border:"1px solid rgba(0,212,138,0.25)", borderRadius:100, padding:"4px 14px", fontSize:12, color:"var(--green)", marginBottom:12 }}>
          🏥 Provider View — Read Only
        </div>
        <h1 className="sora" style={{ fontSize:24, fontWeight:800 }}>
          Welcome, {user?.displayName?.split(" ")[0]} 👋
        </h1>
        <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>Your billing summary — managed by your billing team</p>
      </div>

      <div className="stat-grid" style={{ marginBottom:28 }}>
        {[
          { icon:"📋", label:"Total Claims",   val:loading?"—":claims.length,    color:"var(--white)"  },
          { icon:"💰", label:"Total Billed",   val:loading?"—":fmt(totalCharge), color:"var(--blue2)"  },
          { icon:"✅", label:"Collected",      val:loading?"—":fmt(totalPaid),   color:"var(--green)"  },
          { icon:"⚖️", label:"Outstanding",    val:loading?"—":fmt(balance),     color:"var(--yellow)" },
        ].map((s,i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{ color:s.color, fontSize:24 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24 }}>
        <div className="data-card">
          <div className="data-card-header">
            <span className="data-card-title sora">Recent Claims</span>
            <a href="/provider-portal/claims" className="btn btn-ghost btn-sm">View all</a>
          </div>
          {loading ? (
            <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>Loading...</div>
          ) : claims.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No claims yet</div>
              <div className="empty-sub">Your billing team will create claims on your behalf</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Date</th><th>Charge</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {claims.slice(0,8).map(c => (
                  <tr key={c.id}>
                    <td style={{ fontSize:13, color:"var(--muted)" }}>{c.serviceDate}</td>
                    <td style={{ fontWeight:600 }}>{fmt(c.totalCharge||0)}</td>
                    <td style={{ color:"var(--green)" }}>{fmt(c.paidAmount||0)}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.status]||"badge-gray"}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="data-card" style={{ padding:24 }}>
            <div className="sora" style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Summary</div>
            {[
              { label:"Claims Paid",    val:paid,   color:"var(--green)"  },
              { label:"Claims Denied",  val:denied, color:"var(--red)"    },
              { label:"Pending",        val:claims.filter(c=>c.status==="submitted").length, color:"var(--blue2)" },
            ].map((r,i,arr) => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize:13, color:"var(--muted)" }}>{r.label}</span>
                <span style={{ fontSize:18, fontWeight:800, fontFamily:"Sora,sans-serif", color:r.color }}>{r.val}</span>
              </div>
            ))}
          </div>
          <div className="data-card" style={{ padding:24, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📞</div>
            <div className="sora" style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Need help?</div>
            <p style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>Contact your billing team for any questions about claims or payments.</p>
            <a href="mailto:billing@incartbilling.com" className="btn btn-ghost btn-sm">Contact Billing Team</a>
          </div>
        </div>
      </div>
    </div>
  );
}
