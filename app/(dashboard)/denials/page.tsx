"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { getClaims, Claim } from "@/lib/firestore/claims";

type AppealStatus = "not_started" | "in_progress" | "won" | "lost";

interface Denial {
  id?: string;
  claimId: string;
  patientName: string;
  reasonCode: string;
  reasonDesc: string;
  deniedAmount: number;
  appealStatus: AppealStatus;
  dueDate: string;
  notes: string;
  createdAt?: Timestamp;
}

const REASON_CODES: Record<string, string> = {
  "CO-4":  "Procedure not covered",
  "CO-11": "Diagnosis inconsistent with procedure",
  "CO-15": "Authorization required",
  "CO-16": "Claim lacks info",
  "CO-18": "Duplicate claim",
  "CO-27": "Coverage terminated",
  "CO-29": "Timely filing exceeded",
  "CO-97": "Payment included in allowance for another service",
  "CO-197":"Precertification absent",
};

const APPEAL_BADGE: Record<AppealStatus, string> = {
  not_started: "badge-gray",
  in_progress:  "badge-yellow",
  won:          "badge-green",
  lost:         "badge-red",
};

const APPEAL_LABEL: Record<AppealStatus, string> = {
  not_started: "Not Started",
  in_progress:  "In Progress",
  won:          "Won",
  lost:         "Lost",
};

export default function DenialsPage() {
  const [denials, setDenials]   = useState<Denial[]>([]);
  const [claims, setClaims]     = useState<Claim[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState<Omit<Denial, "id" | "createdAt">>({
    claimId: "", patientName: "", reasonCode: "CO-4",
    reasonDesc: "", deniedAmount: 0, appealStatus: "not_started",
    dueDate: "", notes: "",
  });

  const load = async () => {
    const [snap, c] = await Promise.all([
      getDocs(query(collection(db, "denials"), orderBy("createdAt", "desc"))),
      getClaims(),
    ]);
    setDenials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Denial)));
    setClaims(c); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: k === "deniedAmount" ? parseFloat(e.target.value) || 0 : e.target.value }));

  const onClaimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = claims.find(c => c.id === e.target.value);
    setForm(f => ({ ...f, claimId: e.target.value, patientName: c?.patientName || "", deniedAmount: c?.totalCharge || 0 }));
  };

  const onReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, reasonCode: e.target.value, reasonDesc: REASON_CODES[e.target.value] || "" }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await addDoc(collection(db, "denials"), { ...form, createdAt: serverTimestamp() });
    setForm({ claimId: "", patientName: "", reasonCode: "CO-4", reasonDesc: "", deniedAmount: 0, appealStatus: "not_started", dueDate: "", notes: "" });
    setShowForm(false); setSaving(false); load();
  };

  const updateAppeal = async (id: string, appealStatus: AppealStatus) => {
    await updateDoc(doc(db, "denials", id), { appealStatus });
    load();
  };

  const totalDenied = denials.reduce((s, d) => s + (d.deniedAmount || 0), 0);
  const won         = denials.filter(d => d.appealStatus === "won").length;
  const pending     = denials.filter(d => d.appealStatus === "in_progress").length;

  return (
    <div className="dash-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Denial Management</h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>Track and appeal denied claims</div>
        </div>
        <button className="btn btn-blue" onClick={() => setShowForm(!showForm)}>+ Log Denial</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Denied",   val: `$${totalDenied.toFixed(2)}`, color: "var(--red)"    },
          { label: "Total Denials",  val: denials.length,                color: "var(--white)"  },
          { label: "Appeals Won",    val: won,                           color: "var(--green)"  },
          { label: "In Progress",    val: pending,                       color: "var(--yellow)" },
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
            <div className="panel-title sora">Log Denial</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CLAIM</label>
                <select className="form-select" value={form.claimId} onChange={onClaimChange} required>
                  <option value="">Select claim...</option>
                  {claims.map(c => <option key={c.id} value={c.id}>{c.patientName} — ${c.totalCharge?.toFixed(2)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">DENIED AMOUNT ($)</label>
                <input className="form-input" type="number" step="0.01" value={form.deniedAmount} onChange={set("deniedAmount")} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">REASON CODE</label>
                <select className="form-select" value={form.reasonCode} onChange={onReasonChange}>
                  {Object.entries(REASON_CODES).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">APPEAL DUE DATE</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={set("dueDate")} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">NOTES</label>
              <input className="form-input" placeholder="Additional notes about this denial..." value={form.notes} onChange={set("notes")} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "Saving..." : "Log Denial"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">All Denials</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{denials.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : denials.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚫</div>
            <div className="empty-title">No denials logged</div>
            <div className="empty-sub">Log denied claims to track appeals and recover revenue</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Patient</th><th>Reason</th><th>Amount</th><th>Due Date</th><th>Appeal Status</th><th>Update</th></tr>
            </thead>
            <tbody>
              {denials.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.patientName}</td>
                  <td>
                    <span className="badge badge-red" style={{ fontFamily: "monospace", marginRight: 6 }}>{d.reasonCode}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{d.reasonDesc}</span>
                  </td>
                  <td style={{ color: "var(--red)", fontWeight: 700 }}>${(d.deniedAmount || 0).toFixed(2)}</td>
                  <td style={{ fontSize: 13, color: d.dueDate && new Date(d.dueDate) < new Date() ? "var(--red)" : "var(--muted)" }}>
                    {d.dueDate || "—"}
                  </td>
                  <td><span className={`badge ${APPEAL_BADGE[d.appealStatus]}`}>{APPEAL_LABEL[d.appealStatus]}</span></td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
                      value={d.appealStatus}
                      onChange={e => updateAppeal(d.id!, e.target.value as AppealStatus)}
                    >
                      {(Object.keys(APPEAL_BADGE) as AppealStatus[]).map(s => (
                        <option key={s} value={s}>{APPEAL_LABEL[s]}</option>
                      ))}
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
