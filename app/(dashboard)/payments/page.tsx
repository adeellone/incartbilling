"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { getClaims, updateClaim, Claim } from "@/lib/firestore/claims";

interface Payment {
  id?: string;
  claimId: string;
  patientName: string;
  amount: number;
  type: "insurance" | "patient";
  method: string;
  notes: string;
  postedAt?: Timestamp;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claims, setClaims]     = useState<Claim[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState<Omit<Payment, "id" | "postedAt">>({
    claimId: "", patientName: "", amount: 0, type: "insurance", method: "EFT", notes: "",
  });

  const load = async () => {
    const [snap, c] = await Promise.all([
      getDocs(query(collection(db, "payments"), orderBy("postedAt", "desc"))),
      getClaims(),
    ]);
    setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    setClaims(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: k === "amount" ? parseFloat(e.target.value) || 0 : e.target.value }));

  const onClaimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = claims.find(c => c.id === e.target.value);
    setForm(f => ({ ...f, claimId: e.target.value, patientName: c?.patientName || "" }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await addDoc(collection(db, "payments"), { ...form, postedAt: serverTimestamp() });
    if (form.claimId) await updateClaim(form.claimId, { paidAmount: form.amount, status: "paid" });
    setForm({ claimId: "", patientName: "", amount: 0, type: "insurance", method: "EFT", notes: "" });
    setShowForm(false); setSaving(false); load();
  };

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="dash-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Payments</h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>Track insurance and patient payments</div>
        </div>
        <button className="btn btn-blue" onClick={() => setShowForm(!showForm)}>+ Post Payment</button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        {[
          { label: "Total Collected",    val: `$${total.toFixed(2)}`,                            color: "var(--green)" },
          { label: "Insurance Payments", val: payments.filter(p => p.type === "insurance").length, color: "var(--blue2)" },
          { label: "Patient Payments",   val: payments.filter(p => p.type === "patient").length,   color: "var(--cyan)"  },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">Post Payment</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CLAIM</label>
                <select className="form-select" value={form.claimId} onChange={onClaimChange} required>
                  <option value="">Select claim...</option>
                  {claims.map(c => <option key={c.id} value={c.id}>{c.patientName} — ${c.totalCharge?.toFixed(2)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AMOUNT ($)</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.amount} onChange={set("amount")} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">TYPE</label>
                <select className="form-select" value={form.type} onChange={set("type")}>
                  <option value="insurance">Insurance</option>
                  <option value="patient">Patient</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">METHOD</label>
                <select className="form-select" value={form.method} onChange={set("method")}>
                  {["EFT","Check","Credit Card","Cash","ERA"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">NOTES</label>
              <input className="form-input" placeholder="Reference number, check number..." value={form.notes} onChange={set("notes")} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "Posting..." : "Post Payment"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">Payment History</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{payments.length} payments</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : payments.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">💰</div>
            <div className="empty-title">No payments posted yet</div>
            <div className="empty-sub">Post your first payment to track collections</div>
            <button className="btn btn-blue btn-sm" onClick={() => setShowForm(true)}>Post Payment</button>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Amount</th><th>Type</th><th>Method</th><th>Notes</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.patientName || "—"}</td>
                  <td style={{ color: "var(--green)", fontWeight: 700 }}>${(p.amount || 0).toFixed(2)}</td>
                  <td><span className={`badge ${p.type === "insurance" ? "badge-blue" : "badge-green"}`}>{p.type}</span></td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{p.method}</td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
