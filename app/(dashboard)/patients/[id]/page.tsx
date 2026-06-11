"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import { useReady } from "@/hooks/useReady";
import { updatePatient, Patient } from "@/lib/firestore/patients";
import { Claim } from "@/lib/firestore/claims";

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-green", submitted: "badge-blue",
  denied: "badge-red", draft: "badge-gray", pending: "badge-yellow",
};

export default function PatientDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { ready, queryCompanyId } = useReady();

  // Real-time listeners
  const { data: patients } = useCollection<Patient>("patients", { companyId: queryCompanyId });
  const { data: allClaims } = useCollection<Claim>("claims",   { companyId: queryCompanyId });

  const patient = patients.find(p => p.id === id) ?? null;
  const claims  = allClaims.filter(c => c.patientId === id);

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<Partial<Patient>>({});
  const [saving,  setSaving]  = useState(false);

  // Sync form when patient loads
  const effectiveForm = editing ? form : (patient || {});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editing) { setForm(patient || {}); setEditing(true); }
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const startEdit = () => { setForm(patient || {}); setEditing(true); };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    await updatePatient(id, form);
    setEditing(false);
    setSaving(false);
    // onSnapshot updates patient automatically
  };

  if (!ready) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!patient) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ color: "var(--muted)", fontSize: 14 }}>Patient not found or loading...</div>
    </div>
  );

  return (
    <div className="dash-content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/patients")}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>{patient.firstName} {patient.lastName}</h1>
          <div style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            Patient ID: {id}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              Live
            </span>
          </div>
        </div>
        <a href={`/claims/new?patientId=${id}&patientName=${patient.firstName} ${patient.lastName}`} className="btn btn-blue btn-sm">+ New Claim</a>
        <button className="btn btn-ghost btn-sm" onClick={() => editing ? setEditing(false) : startEdit()}>
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="detail-grid">
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Personal Info */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Personal Information</span>
            </div>
            <div style={{ padding: 24 }}>
              {editing ? (
                <div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">FIRST NAME</label><input className="form-input" value={form.firstName || ""} onChange={set("firstName")} /></div>
                    <div className="form-group"><label className="form-label">LAST NAME</label><input className="form-input" value={form.lastName || ""} onChange={set("lastName")} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">DOB</label><input className="form-input" type="date" value={form.dob || ""} onChange={set("dob")} /></div>
                    <div className="form-group">
                      <label className="form-label">GENDER</label>
                      <select className="form-select" value={form.gender || ""} onChange={set("gender")}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">PHONE</label><input className="form-input" value={form.phone || ""} onChange={set("phone")} /></div>
                    <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" value={form.email || ""} onChange={set("email")} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">ADDRESS</label><input className="form-input" value={form.address || ""} onChange={set("address")} /></div>
                  <div className="form-actions">
                    <button className="btn btn-blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </div>
              ) : (
                [
                  ["Full Name",     `${patient.firstName} ${patient.lastName}`],
                  ["Date of Birth", patient.dob],
                  ["Gender",        patient.gender],
                  ["Phone",         patient.phone],
                  ["Email",         patient.email],
                  ["Address",       patient.address],
                ].map(([k, v]) => (
                  <div className="detail-row" key={k}>
                    <span className="detail-key">{k}</span>
                    <span className="detail-val">{v || "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Claims */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Claims ({claims.length})</span>
              <a href={`/claims/new?patientId=${id}`} className="btn btn-ghost btn-sm">New Claim</a>
            </div>
            {claims.length === 0 ? (
              <div className="empty" style={{ padding: 32 }}>
                <div className="empty-icon">📋</div>
                <div className="empty-title">No claims yet</div>
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Date</th><th>Provider</th><th>Charge</th><th>Status</th></tr></thead>
                <tbody>
                  {claims.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 13 }}>{c.serviceDate}</td>
                      <td style={{ color: "var(--muted)", fontSize: 13 }}>{c.providerName}</td>
                      <td style={{ fontWeight: 600 }}>${(c.totalCharge || 0).toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_BADGE[c.status] || "badge-gray"}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right - Insurance */}
        <div>
          <div className="data-card">
            <div className="data-card-header"><span className="data-card-title sora">Insurance</span></div>
            <div style={{ padding: 24 }}>
              {[
                ["Payer",        patient.insurance?.payer],
                ["Plan Name",    patient.insurance?.planName],
                ["Member ID",    patient.insurance?.memberId],
                ["Group Number", patient.insurance?.groupNumber],
              ].map(([k, v]) => (
                <div className="detail-row" key={k}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val" style={{ fontFamily: v ? "monospace" : undefined }}>{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
