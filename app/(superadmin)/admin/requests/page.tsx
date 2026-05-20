"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, updateDoc, doc, Timestamp } from "firebase/firestore";

interface DemoRequest {
  id?: string;
  name: string; company: string; email: string;
  phone: string; size: string; message: string;
  status?: "new"|"contacted"|"converted"|"closed";
  createdAt?: Timestamp;
}

const BADGE: Record<string, string> = {
  new:"badge-blue", contacted:"badge-yellow", converted:"badge-green", closed:"badge-gray",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    const snap = await getDocs(query(collection(db, "demo_requests"), orderBy("createdAt", "desc")));
    setRequests(snap.docs.map(d => ({ id:d.id, ...d.data() } as DemoRequest)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "demo_requests", id), { status }); load();
  };

  const newCount = requests.filter(r => !r.status || r.status === "new").length;

  return (
    <div className="dash-content">
      <div style={{ marginBottom:28 }}>
        <h1 className="sora" style={{ fontSize:24, fontWeight:800 }}>Demo Requests</h1>
        <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>
          Leads from landing page
          {newCount > 0 && <span className="badge badge-blue" style={{ marginLeft:10 }}>{newCount} new</span>}
        </p>
      </div>
      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">All Requests ({requests.length})</span></div>
        {loading ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty"><div className="empty-icon">📬</div><div className="empty-title">No requests yet</div></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Size</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:600 }}>{r.name}</td>
                  <td>{r.company}</td>
                  <td><a href={`mailto:${r.email}`} className="tbl-link" style={{ fontSize:13 }}>{r.email}</a></td>
                  <td style={{ fontSize:13, color:"var(--muted)" }}>{r.phone||"—"}</td>
                  <td style={{ fontSize:12, color:"var(--muted)" }}>{r.size}</td>
                  <td style={{ fontSize:12, color:"var(--muted)", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.message||"—"}</td>
                  <td>
                    <select className="form-select" style={{ width:"auto", fontSize:12, padding:"4px 8px" }}
                      value={r.status||"new"} onChange={e => updateStatus(r.id!, e.target.value)}>
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
