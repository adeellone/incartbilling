"use client";
import { useCollection } from "@/hooks/useCollection";
import { updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DemoRequest {
  id?: string;
  name: string; company: string; email: string; phone: string;
  size: string; message: string;
  status?: "new" | "contacted" | "converted" | "closed";
  createdAt?: Timestamp;
}

const BADGE: Record<string, string> = {
  new: "badge-blue", contacted: "badge-yellow",
  converted: "badge-green", closed: "badge-gray",
};

export default function AdminRequestsPage() {
  // Real-time listener on demo_requests (no companyId filter)
  const { data: requests, loading } = useCollection<DemoRequest>("demo_requests", {
    orderByField: "createdAt",
    enabled: true,
  });

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "demo_requests", id), { status });
    // onSnapshot fires automatically
  };

  const newCount = requests.filter(r => !r.status || r.status === "new").length;

  return (
    <div className="dash-content">
      <div style={{ marginBottom: 28 }}>
        <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Demo Requests</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          Leads from landing page
          {newCount > 0 && <span className="badge badge-blue" style={{ marginLeft: 10 }}>{newCount} new</span>}
          <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Live
          </span>
        </p>
      </div>

      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">All Requests ({requests.length})</span></div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty"><div className="empty-icon">📬</div><div className="empty-title">No requests yet</div></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Size</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.company}</td>
                  <td><a href={`mailto:${r.email}`} className="tbl-link" style={{ fontSize: 13 }}>{r.email}</a></td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{r.phone || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.size}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message || "—"}</td>
                  <td>
                    <select className="form-select" style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
                      value={r.status || "new"}
                      onChange={e => updateStatus(r.id!, e.target.value)}>
                      {["new","contacted","converted","closed"].map(s => <option key={s}>{s}</option>)}
                    </select>
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
