"use client";
import { useState } from "react";
import { useReady } from "@/hooks/useReady";
import { useCollection } from "@/hooks/useCollection";
import { addProvider, deleteProvider, Provider } from "@/lib/firestore/providers";

const SPECS = [
  "General Practice","Internal Medicine","Family Medicine","Cardiology",
  "Orthopedics","Radiology","Mental Health","Dermatology","Pediatrics",
  "Urgent Care","Dental","Physical Therapy",
];

const EMPTY = {
  companyId: "",
  firstName: "",
  lastName: "",
  npi: "",
  specialty: "General Practice",
  email: "",
  phone: "",
  taxId: "",
  payers: [] as string[],
};

export default function ProvidersPage() {
  const { ready, queryCompanyId, companyId } = useReady();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [payerInput, setPayerInput] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Real-time listener ───────────────────────────────────────────
  const { data: providers, loading } = useCollection<Provider>("providers", {
    companyId: queryCompanyId,
    enabled: ready,
  });

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const addPayer = () => {
    if (payerInput.trim()) {
      setForm((f) => ({ ...f, payers: [...f.payers, payerInput.trim()] }));
      setPayerInput("");
    }
  };

  const removePayer = (i: number) =>
    setForm((f) => ({ ...f, payers: f.payers.filter((_, j) => j !== i) }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await addProvider({ ...form, companyId: companyId! });
    setForm(EMPTY);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    await deleteProvider(id);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>
            Providers
          </h1>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
            {loading ? "Loading..." : `${providers.length} registered`}
            <span
              style={{
                marginLeft: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--green)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--green)",
                  display: "inline-block",
                }}
              />
              Live
            </span>
          </div>
        </div>
        <button className="btn btn-blue" onClick={() => setShowForm(!showForm)}>
          + Add Provider
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: 28 }}>
          <form className="panel" onSubmit={handleAdd}>
            <div className="panel-title sora">New Provider</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">FIRST NAME</label>
                <input
                  className="form-input"
                  value={form.firstName}
                  onChange={set("firstName")}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">LAST NAME</label>
                <input
                  className="form-input"
                  value={form.lastName}
                  onChange={set("lastName")}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">SPECIALTY</label>
                <select
                  className="form-select"
                  value={form.specialty}
                  onChange={set("specialty")}
                >
                  {SPECS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">NPI NUMBER</label>
                <input
                  className="form-input"
                  value={form.npi}
                  onChange={set("npi")}
                  required
                  style={{ fontFamily: "monospace" }}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">EMAIL</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PHONE</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">TAX ID</label>
              <input
                className="form-input"
                value={form.taxId}
                onChange={set("taxId")}
                style={{ fontFamily: "monospace" }}
              />
            </div>
            <hr className="form-divider" />
            <div className="form-section">Accepted Payers</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                className="form-input"
                placeholder="e.g. Medicare"
                value={payerInput}
                onChange={(e) => setPayerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPayer();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={addPayer}
              >
                Add
              </button>
            </div>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
            >
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
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-blue"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Provider"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">All Providers</span>
        </div>
        {loading ? (
          <div
            style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}
          >
            Loading...
          </div>
        ) : providers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏥</div>
            <div className="empty-title">No providers yet</div>
            <button
              className="btn btn-blue btn-sm"
              onClick={() => setShowForm(true)}
            >
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
                <th>Payers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>
                    {p.firstName} {p.lastName}
                  </td>
                  <td>
                    <span className="badge badge-blue">{p.specialty}</span>
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {p.npi}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {p.phone || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.payers?.slice(0, 2).map((py) => (
                        <span
                          key={py}
                          className="badge badge-gray"
                          style={{ fontSize: 11 }}
                        >
                          {py}
                        </span>
                      ))}
                      {(p.payers?.length || 0) > 2 && (
                        <span
                          className="badge badge-gray"
                          style={{ fontSize: 11 }}
                        >
                          +{p.payers.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href="/credentialing" className="btn btn-ghost btn-sm">
                        Credential
                      </a>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleDelete(
                            p.id!,
                            `${p.firstName} ${p.lastName}`
                          )
                        }
                      >
                        Del
                      </button>
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
