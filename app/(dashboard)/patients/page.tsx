"use client";
import { useEffect, useState } from "react";
import { getPatients, addPatient, deletePatient, Patient } from "@/lib/firestore/patients";

const EMPTY_FORM = {
  firstName: "", lastName: "", dob: "", gender: "Male", phone: "", email: "", address: "",
  insurance: { planName: "", memberId: "", groupNumber: "", payer: "" },
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => getPatients().then((p) => { setPatients(p); setFiltered(p); setLoading(false); });
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
    ));
  }, [search, patients]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setIns = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, insurance: { ...f.insurance, [k]: e.target.value } }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await addPatient(form);
    setForm(EMPTY_FORM); setShowForm(false); setSaving(false); load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete patient ${name}?`)) return;
    await deletePatient(id); load();
  };

  return (
    <div className="dash-content">
      {/* Header */}
      <div className="dash-header" style={{ position: "static", background: "none", border: "none", padding: "0 0 24px 0" }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Patients</h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{patients.length} total patients</div>
        </div>
        <button className="btn btn-blue" onClick={() => setShowForm(true)}>+ Add Patient</button>
      </div>

      {/* Add Patient Form */}
      {showForm && (
        <div style={{ marginBottom: 28 }}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">New Patient</div>

            <div className="form-section">Personal Information</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">FIRST NAME</label><input className="form-input" value={form.firstName} onChange={set("firstName")} required /></div>
              <div className="form-group"><label className="form-label">LAST NAME</label><input className="form-input" value={form.lastName} onChange={set("lastName")} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">DATE OF BIRTH</label><input className="form-input" type="date" value={form.dob} onChange={set("dob")} required /></div>
              <div className="form-group">
                <label className="form-label">GENDER</label>
                <select className="form-select" value={form.gender} onChange={set("gender")}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">PHONE</label><input className="form-input" value={form.phone} onChange={set("phone")} required /></div>
              <div className="form-group"><label className="form-label">EMAIL</label><input className="form-input" type="email" value={form.email} onChange={set("email")} /></div>
            </div>
            <div className="form-group"><label className="form-label">ADDRESS</label><input className="form-input" value={form.address} onChange={set("address")} /></div>

            <hr className="form-divider" />
            <div className="form-section">Insurance Information</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">PLAN NAME</label><input className="form-input" value={form.insurance.planName} onChange={setIns("planName")} /></div>
              <div className="form-group"><label className="form-label">PAYER</label><input className="form-input" placeholder="e.g. BlueCross" value={form.insurance.payer} onChange={setIns("payer")} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">MEMBER ID</label><input className="form-input" value={form.insurance.memberId} onChange={setIns("memberId")} /></div>
              <div className="form-group"><label className="form-label">GROUP NUMBER</label><input className="form-input" value={form.insurance.groupNumber} onChange={setIns("groupNumber")} /></div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "Saving..." : "Save Patient"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <span style={{ color: "var(--muted)" }}>🔍</span>
          <input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">All Patients</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{filtered.length} results</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👤</div>
            <div className="empty-title">{search ? "No results found" : "No patients yet"}</div>
            <div className="empty-sub">{search ? "Try a different search term" : "Add your first patient to get started"}</div>
            {!search && <button className="btn btn-blue btn-sm" onClick={() => setShowForm(true)}>Add Patient</button>}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Name</th><th>DOB</th><th>Phone</th><th>Insurance</th><th>Member ID</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td><a href={`/patients/${p.id}`} className="tbl-link">{p.firstName} {p.lastName}</a></td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{p.dob}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{p.phone}</td>
                  <td>{p.insurance?.payer || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td style={{ fontSize: 13, fontFamily: "monospace", color: "var(--muted)" }}>{p.insurance?.memberId || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`/patients/${p.id}`} className="btn btn-ghost btn-sm">View</a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id!, `${p.firstName} ${p.lastName}`)}>Delete</button>
                    </div>
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
