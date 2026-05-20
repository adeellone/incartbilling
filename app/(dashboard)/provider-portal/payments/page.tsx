"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface Payment { id?: string; claimId:string; patientName:string; amount:number; type:string; method:string; }

export default function ProviderPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "payments"), orderBy("postedAt", "desc"))).then(snap => {
      setPayments(snap.docs.map(d => ({ id:d.id, ...d.data() } as Payment)));
      setLoading(false);
    });
  }, [user]);

  const total = payments.reduce((s, p) => s + (p.amount||0), 0);

  return (
    <div className="dash-content">
      <div style={{ marginBottom:28 }}>
        <h1 className="sora" style={{ fontSize:24, fontWeight:800 }}>My Payments</h1>
        <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>Payments collected on your behalf</p>
      </div>
      <div className="stat-card" style={{ maxWidth:240, marginBottom:24 }}>
        <div className="stat-card-label">Total Collected</div>
        <div className="stat-card-val" style={{ color:"var(--green)" }}>${total.toFixed(2)}</div>
      </div>
      <div className="data-card">
        {loading ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>Loading...</div>
        ) : payments.length === 0 ? (
          <div className="empty"><div className="empty-icon">💰</div><div className="empty-title">No payments yet</div></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Amount</th><th>Type</th><th>Method</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.patientName||"—"}</td>
                  <td style={{ color:"var(--green)", fontWeight:700 }}>${(p.amount||0).toFixed(2)}</td>
                  <td><span className={`badge ${p.type==="insurance"?"badge-blue":"badge-green"}`}>{p.type}</span></td>
                  <td style={{ color:"var(--muted)", fontSize:13 }}>{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
