"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getProviders,
  addProvider,
  deleteProvider,
  Provider
} from "@/lib/firestore/providers";
const { companyId } = useAuth();
const SPECIALTIES = [
  "General Practice","Internal Medicine","Family Medicine","Cardiology",
  "Orthopedics","Radiology","Mental Health","Dermatology",
  "Pediatrics","Urgent Care","Dental","Physical Therapy"
];

const EMPTY = {
  firstName: "",
  lastName: "",
  npi: "",
  specialty: "General Practice",
  email: "",
  phone: "",
  taxId: "",
  payers: [] as string[]
};

export default function ProvidersPage() {
  const { companyId } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [payerInput, setPayerInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    getProviders(companyId || undefined).then((p) => {
      setProviders(p);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, [companyId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const addPayer = () => {
    if (payerInput.trim()) {
      setForm((f) => ({
        ...f,
        payers: [...f.payers, payerInput.trim()]
      }));
      setPayerInput("");
    }
  };

  const removePayer = (i: number) =>
    setForm((f) => ({
      ...f,
      payers: f.payers.filter((_, j) => j !== i)
    }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await addProvider({
      ...form,
      companyId: companyId!
    });

    setForm(EMPTY);
    setShowForm(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete provider ${name}?`)) return;
    await deleteProvider(id);
    load();
  };

  return (
    <div className="dash-content">

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Providers</h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
            {providers.length} registered providers
          </div>
        </div>

        <button className="btn btn-blue" onClick={() => setShowForm(!showForm)}>
          + Add Provider
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div style={{ marginBottom: 28 }}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">New Provider</div>

            <div className="form-section">Provider Details</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">FIRST NAME</label>
                <input className="form-input" value={form.firstName} onChange={set("firstName")} required />
              </div>
              <div className="form-group">
                <label className="form-label">LAST NAME</label>
                <input className="form-input" value={form.lastName} onChange={set("lastName")} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">SPECIALTY</label>
                <select className="form-select" value={form.specialty} onChange={set("specialty")}>
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">NPI NUMBER</label>
                <input className="form-input" value={form.npi} onChange={set("npi")} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">EMAIL</label>
                <input className="form-input" value={form.email} onChange={set("email")} />
              </div>
              <div className="form-group">
                <label className="form-label">PHONE</label>
                <input className="form-input" value={form.phone} onChange={set("phone")} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">TAX ID / EIN</label>
              <input className="form-input" value={form.taxId} onChange={set("taxId")} />
            </div>

            <hr className="form-divider" />

            <div className="form-section">Accepted Payers</div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                className="form-input"
                placeholder="e.g. BlueCross BlueShield"
                value={payerInput}
                onChange={(e) => setPayerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPayer();
                  }
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={addPayer}>
                Add
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.payers.map((p, i) => (
                <span
                  key={i}
                  className="badge badge-blue"
                  style={{ cursor: "pointer" }}
                  onClick={() => removePayer(i)}
                >
                  {p} ✕
                </span>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? "Saving..." : "Save Provider"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">All Providers</span>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
            Loading providers...
          </div>
        ) : providers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏥</div>
            <div className="empty-title">No providers yet</div>
            <div className="empty-sub">Add your first provider to start creating claims</div>
            <button className="btn btn-blue btn-sm" onClick={() => setShowForm(true)}>
              Add Provider
            </button>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>NPI</th>
                <th>Phone</th>
                <th>Tax ID</th>
                <th>Payers</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                  <td><span className="badge badge-blue">{p.specialty}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{p.npi}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{p.phone || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{p.taxId || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.payers?.slice(0, 2).map((pay) => (
                        <span key={pay} className="badge badge-gray">{pay}</span>
                      ))}
                      {(p.payers?.length || 0) > 2 && (
                        <span className="badge badge-gray">+{p.payers.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.id!, `${p.firstName} ${p.lastName}`)}
                    >
                      Delete
                    </button>
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