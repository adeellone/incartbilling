"use client";
import { useState, useRef } from "react";
import { useReady } from "@/hooks/useReady";
import { useCollection } from "@/hooks/useCollection";
import {
  addDocument, deleteDocument, uploadFile,
  getDocStatusFromExpiry, DOC_TYPE_LABEL,
  ProviderDocument, DocumentType,
} from "@/lib/firestore/documents";
import { Provider } from "@/lib/firestore/providers";

const DOC_TYPES: DocumentType[] = ["license","malpractice","dea","npi","w9","board_cert","cv","other"];
const SB: Record<string, string> = { active: "badge-green", expiring_soon: "badge-yellow", expired: "badge-red" };

export default function DocumentsPage() {
  const { ready, queryCompanyId, companyId } = useReady();
  const [showForm, setShowForm]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [filter, setFilter]       = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ providerId: "", providerName: "", type: "license" as DocumentType, name: "", expiryDate: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);

  // ── Real-time listeners ──────────────────────────────────────────
  const { data: docs,      loading } = useCollection<ProviderDocument>("documents", { companyId: queryCompanyId, orderByField: "uploadedAt" });
  const { data: providers            } = useCollection<Provider>("providers",        { companyId: queryCompanyId });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const onProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = providers.find(p => p.id === e.target.value);
    setForm(f => ({ ...f, providerId: e.target.value, providerName: p ? `${p.firstName} ${p.lastName}` : "" }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); if (!form.name) setForm(fm => ({ ...fm, name: f.name.replace(/\.[^/.]+$/, "") })); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.providerId) return;
    setUploading(true); setProgress(0);
    const path = `documents/${companyId}/${form.providerId}/${Date.now()}_${file.name}`;
    const url  = await uploadFile(file, path, setProgress);
    const status = getDocStatusFromExpiry(form.expiryDate);
    await addDocument({ companyId: companyId!, ...form, fileName: file.name, fileUrl: url, storagePath: path, fileSize: file.size, status, notes: form.notes });
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setForm({ providerId: "", providerName: "", type: "license", name: "", expiryDate: "", notes: "" });
    setShowForm(false); setUploading(false);
  };

  const handleDelete = async (doc: ProviderDocument) => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    await deleteDocument(doc.id!, doc.storagePath);
  };

  const filtered = filter === "all" ? docs
    : docs.filter(d => filter === "expiring" ? d.status === "expiring_soon"
      : filter === "expired" ? d.status === "expired"
      : d.type === filter);

  const expiring = docs.filter(d => d.status === "expiring_soon").length;
  const expired  = docs.filter(d => d.status === "expired").length;
  const fmtSize  = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

  if (!ready) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>Loading...</div>
  );

  return (
    <div className="dash-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>Documents</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {loading ? "Loading..." : `${docs.length} documents stored`}
            <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              Live
            </span>
          </p>
        </div>
        <button className="btn btn-blue" onClick={() => setShowForm(!showForm)}>+ Upload Document</button>
      </div>

      {(expiring > 0 || expired > 0) && (
        <div style={{ background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", gap: 24, alignItems: "center" }}>
          {expired  > 0 && <span style={{ color: "var(--red)",    fontWeight: 700 }}>⛔ {expired} expired</span>}
          {expiring > 0 && <span style={{ color: "var(--yellow)", fontWeight: 700 }}>⚠️ {expiring} expiring soon</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter("expiring")} style={{ marginLeft: "auto" }}>View Expiring</button>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total",         val: docs.length,                                    color: "var(--white)"  },
          { label: "Active",        val: docs.filter(d => d.status === "active").length, color: "var(--green)"  },
          { label: "Expiring Soon", val: expiring,                                       color: "var(--yellow)" },
          { label: "Expired",       val: expired,                                        color: "var(--red)"    },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <form className="panel" onSubmit={handleUpload}>
            <div className="panel-title sora">Upload Document</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PROVIDER ({providers.length} available)</label>
                <select className="form-select" value={form.providerId} onChange={onProviderChange} required>
                  <option value="">Select provider...</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">TYPE</label>
                <select className="form-select" value={form.type} onChange={set("type")}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">DOCUMENT NAME</label><input className="form-input" value={form.name} onChange={set("name")} required /></div>
              <div className="form-group"><label className="form-label">EXPIRY DATE</label><input className="form-input" type="date" value={form.expiryDate} onChange={set("expiryDate")} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">FILE (PDF, JPG, PNG)</label>
              <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", background: "rgba(27,111,235,0.04)" }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setForm(fm => ({ ...fm, name: fm.name || f.name.replace(/\.[^/.]+$/, "") })); } }}>
                {file ? (
                  <div style={{ color: "var(--green)" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{fmtSize(file.size)}</div>
                  </div>
                ) : (
                  <div style={{ color: "var(--muted)" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload or drag & drop</div>
                    <div style={{ fontSize: 12 }}>PDF, JPG, PNG up to 10MB</div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={onFileChange} />
              </div>
            </div>
            {uploading && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--muted)" }}>Uploading...</span>
                  <span style={{ fontWeight: 600 }}>{progress}%</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "var(--blue)", borderRadius: 3, transition: "width 0.2s" }} />
                </div>
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={uploading || !file}>{uploading ? `Uploading ${progress}%...` : "Upload Document"}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { val: "all",      label: `All (${docs.length})`        },
          { val: "expiring", label: `⚠️ Expiring (${expiring})`   },
          { val: "expired",  label: `⛔ Expired (${expired})`     },
          ...DOC_TYPES.map(t => ({ val: t, label: DOC_TYPE_LABEL[t] })),
        ].map(f => (
          <button key={f.val} className={`btn btn-sm ${filter === f.val ? "btn-blue" : "btn-ghost"}`} onClick={() => setFilter(f.val)}>{f.label}</button>
        ))}
      </div>

      <div className="data-card">
        <div className="data-card-header"><span className="data-card-title sora">{filtered.length} Documents</span></div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No documents found</div>
            <button className="btn btn-blue btn-sm" onClick={() => setShowForm(true)}>Upload Document</button>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Document</th><th>Provider</th><th>Type</th><th>Expiry</th><th>Status</th><th>Size</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{d.providerName}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{DOC_TYPE_LABEL[d.type]}</span></td>
                  <td style={{ fontSize: 13, color: d.status === "expired" ? "var(--red)" : d.status === "expiring_soon" ? "var(--yellow)" : "var(--muted)" }}>{d.expiryDate || "—"}</td>
                  <td><span className={`badge ${SB[d.status]}`}>{d.status.replace("_", " ")}</span></td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtSize(d.fileSize || 0)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View</a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}>Del</button>
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
