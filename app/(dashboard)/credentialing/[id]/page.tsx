"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCredentialing, updateCredentialing, Credentialing, CredentialingStatus, getExpiryStatus, daysUntilExpiry, PayerEnrollment } from "@/lib/firestore/credentialing";
import { getDocuments, ProviderDocument } from "@/lib/firestore/documents";
import { useAuth } from "@/context/AuthContext";
import { useReady } from "@/hooks/useReady";

const STATUS_BADGE: Record<CredentialingStatus, string> = {
  pending:"badge-gray", in_progress:"badge-yellow",
  approved:"badge-green", expired:"badge-red", rejected:"badge-red",
};

const PAYER_BADGE: Record<string, string> = {
  not_started:"badge-gray", submitted:"badge-yellow",
  approved:"badge-green", rejected:"badge-red",
};

const PAYERS = ["Medicare","Medicaid","Blue Cross Blue Shield","Aetna","Cigna","UnitedHealth","Humana","Tricare","Anthem","Molina"];

export default function CredentialingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { ready, queryCompanyId } = useReady();
  const [cred, setCred]   = useState<Credentialing | null>(null);
  const [docs, setDocs]   = useState<ProviderDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm]   = useState<Partial<Credentialing>>({});
  const [addingPayer, setAddingPayer] = useState(false);
  const [newPayer, setNewPayer] = useState({ payerName:"", payerId:"", status:"not_started", submittedDate:"", approvedDate:"", notes:"" });

  const load = async () => {
    if (!id) return;
    const [c, d] = await Promise.all([
      getCredentialing(id),
      getDocuments(queryCompanyId, undefined),
    ]);
    setCred(c);
    setForm(c || {});
    setDocs(d.filter(doc => doc.providerId === c?.providerId));
  };

  useEffect(() => { load(); }, [id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    await updateCredentialing(id, form);
    await load(); setEditing(false); setSaving(false);
  };

  const updatePayerStatus = async (i: number, status: string) => {
    if (!id || !cred) return;
    const payers = [...(cred.payers || [])];
    payers[i] = { ...payers[i], status: status as PayerEnrollment["status"] };
    await updateCredentialing(id, { payers });
    await load();
  };

  const handleAddPayer = async () => {
    if (!id || !cred || !newPayer.payerName) return;
    const payers = [...(cred.payers || []), newPayer as PayerEnrollment];
    await updateCredentialing(id, { payers });
    setNewPayer({ payerName:"", payerId:"", status:"not_started", submittedDate:"", approvedDate:"", notes:"" });
    setAddingPayer(false); await load();
  };

  const removePayer = async (i: number) => {
    if (!id || !cred) return;
    const payers = cred.payers.filter((_, j) => j !== i);
    await updateCredentialing(id, { payers });
    await load();
  };

  const ExpiryRow = ({ label, date }: { label: string; date: string }) => {
    const s = getExpiryStatus(date);
    const d = daysUntilExpiry(date);
    const color = s === "expired" ? "var(--red)" : s === "expiring_soon" ? "var(--yellow)" : "var(--green)";
    return (
      <div className="detail-row">
        <span className="detail-key">{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span className="detail-val">{date || "—"}</span>
          {date && <span style={{ fontSize:12, color, fontWeight:600 }}>
            {s === "expired" ? "⛔ Expired" : s === "expiring_soon" ? `⚠️ ${d} days left` : "✅ Valid"}
          </span>}
        </div>
      </div>
    );
  };

  if (!cred) return <div className="dash-content" style={{ textAlign:"center", paddingTop:80, color:"var(--muted)" }}>Loading...</div>;

  const approvedPayers  = cred.payers?.filter(p => p.status === "approved").length || 0;
  const submittedPayers = cred.payers?.filter(p => p.status === "submitted").length || 0;

  return (
    <div className="dash-content">
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/credentialing")}>← Back</button>
        <div style={{ flex:1 }}>
          <h1 className="sora" style={{ fontSize:22, fontWeight:800 }}>{cred.providerName}</h1>
          <div style={{ color:"var(--muted)", fontSize:12, marginTop:2 }}>NPI: {cred.npi || "—"}</div>
        </div>
        <select className="form-select" style={{ width:"auto" }}
          value={cred.status}
          onChange={async e => { await updateCredentialing(id, { status: e.target.value as CredentialingStatus }); load(); }}>
          {["pending","in_progress","approved","expired","rejected"].map(s => <option key={s}>{s}</option>)}
        </select>
        <span className={`badge ${STATUS_BADGE[cred.status]}`} style={{ fontSize:13, padding:"6px 14px" }}>{cred.status.replace("_"," ")}</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Credentials */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Credentials & Expiry Dates</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</button>
            </div>
            <div style={{ padding:24 }}>
              {editing ? (
                <div>
                  <div className="form-section">Medical License</div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">LICENSE #</label><input className="form-input" value={form.licenseNumber||""} onChange={set("licenseNumber")} style={{ fontFamily:"monospace" }}/></div>
                    <div className="form-group"><label className="form-label">STATE</label><input className="form-input" value={form.licenseState||""} onChange={set("licenseState")}/></div>
                    <div className="form-group"><label className="form-label">EXPIRY</label><input className="form-input" type="date" value={form.licenseExpiry||""} onChange={set("licenseExpiry")}/></div>
                  </div>
                  <div className="form-section">DEA</div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">DEA #</label><input className="form-input" value={form.deaNumber||""} onChange={set("deaNumber")} style={{ fontFamily:"monospace" }}/></div>
                    <div className="form-group"><label className="form-label">EXPIRY</label><input className="form-input" type="date" value={form.deaExpiry||""} onChange={set("deaExpiry")}/></div>
                  </div>
                  <div className="form-section">Malpractice</div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">INSURER</label><input className="form-input" value={form.malpracticeInsurer||""} onChange={set("malpracticeInsurer")}/></div>
                    <div className="form-group"><label className="form-label">POLICY #</label><input className="form-input" value={form.malpracticePolicyNumber||""} onChange={set("malpracticePolicyNumber")} style={{ fontFamily:"monospace" }}/></div>
                    <div className="form-group"><label className="form-label">EXPIRY</label><input className="form-input" type="date" value={form.malpracticeExpiry||""} onChange={set("malpracticeExpiry")}/></div>
                  </div>
                  <div className="form-section">Board Certification</div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">CERTIFICATION</label><input className="form-input" value={form.boardCertification||""} onChange={set("boardCertification")}/></div>
                    <div className="form-group"><label className="form-label">EXPIRY</label><input className="form-input" type="date" value={form.boardExpiry||""} onChange={set("boardExpiry")}/></div>
                  </div>
                  <div className="form-group"><label className="form-label">NOTES</label><textarea className="form-input" rows={2} value={form.notes||""} onChange={set("notes")} style={{ resize:"vertical" }}/></div>
                  <div className="form-actions">
                    <button className="btn btn-blue" onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:8, fontSize:12, fontWeight:600, letterSpacing:1, color:"var(--cyan)", textTransform:"uppercase" }}>Medical License</div>
                  <ExpiryRow label="License Number" date={cred.licenseNumber ? `${cred.licenseNumber} (${cred.licenseState})` : ""} />
                  <ExpiryRow label="License Expiry" date={cred.licenseExpiry} />
                  <div style={{ margin:"16px 0 8px", fontSize:12, fontWeight:600, letterSpacing:1, color:"var(--cyan)", textTransform:"uppercase" }}>DEA Certificate</div>
                  <ExpiryRow label="DEA Number" date={cred.deaNumber} />
                  <ExpiryRow label="DEA Expiry" date={cred.deaExpiry} />
                  <div style={{ margin:"16px 0 8px", fontSize:12, fontWeight:600, letterSpacing:1, color:"var(--cyan)", textTransform:"uppercase" }}>Malpractice Insurance</div>
                  <ExpiryRow label="Insurer" date={cred.malpracticeInsurer} />
                  <ExpiryRow label="Policy Number" date={cred.malpracticePolicyNumber} />
                  <ExpiryRow label="Malpractice Expiry" date={cred.malpracticeExpiry} />
                  <div style={{ margin:"16px 0 8px", fontSize:12, fontWeight:600, letterSpacing:1, color:"var(--cyan)", textTransform:"uppercase" }}>Board Certification</div>
                  <ExpiryRow label="Certification" date={cred.boardCertification} />
                  <ExpiryRow label="Board Expiry" date={cred.boardExpiry} />
                  {cred.notes && <div style={{ marginTop:16, padding:12, background:"rgba(255,255,255,0.03)", borderRadius:8, fontSize:13, color:"var(--muted)" }}>{cred.notes}</div>}
                </>
              )}
            </div>
          </div>

          {/* Payer Enrollments */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Payer Enrollments</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setAddingPayer(!addingPayer)}>+ Add Payer</button>
            </div>
            {addingPayer && (
              <div style={{ padding:"16px 24px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:10, alignItems:"flex-end" }}>
                  <div className="form-group" style={{ margin:0 }}>
                    <label className="form-label">PAYER</label>
                    <select className="form-select" value={newPayer.payerName} onChange={e => setNewPayer(p => ({ ...p, payerName:e.target.value }))}>
                      <option value="">Select...</option>
                      {PAYERS.map(py => <option key={py}>{py}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin:0 }}>
                    <label className="form-label">STATUS</label>
                    <select className="form-select" value={newPayer.status} onChange={e => setNewPayer(p => ({ ...p, status:e.target.value }))}>
                      {["not_started","submitted","approved","rejected"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin:0 }}>
                    <label className="form-label">SUBMITTED</label>
                    <input className="form-input" type="date" value={newPayer.submittedDate} onChange={e => setNewPayer(p => ({ ...p, submittedDate:e.target.value }))}/>
                  </div>
                  <div className="form-group" style={{ margin:0 }}>
                    <label className="form-label">APPROVED</label>
                    <input className="form-input" type="date" value={newPayer.approvedDate} onChange={e => setNewPayer(p => ({ ...p, approvedDate:e.target.value }))}/>
                  </div>
                  <button className="btn btn-blue btn-sm" onClick={handleAddPayer}>Add</button>
                </div>
              </div>
            )}
            {(cred.payers?.length || 0) === 0 && !addingPayer ? (
              <div className="empty" style={{ padding:32 }}>
                <div className="empty-icon">🏥</div>
                <div className="empty-title">No payer enrollments</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingPayer(true)}>Add First Payer</button>
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Payer</th><th>Status</th><th>Submitted</th><th>Approved</th><th>Update</th><th></th></tr></thead>
                <tbody>
                  {cred.payers?.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{p.payerName}</td>
                      <td><span className={`badge ${PAYER_BADGE[p.status]||"badge-gray"}`}>{p.status.replace("_"," ")}</span></td>
                      <td style={{ color:"var(--muted)", fontSize:13 }}>{p.submittedDate || "—"}</td>
                      <td style={{ color:"var(--green)", fontSize:13 }}>{p.approvedDate || "—"}</td>
                      <td>
                        <select className="form-select" style={{ width:"auto", fontSize:12, padding:"4px 8px" }}
                          value={p.status} onChange={e => updatePayerStatus(i, e.target.value)}>
                          {["not_started","submitted","approved","rejected"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removePayer(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Documents */}
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title sora">Documents ({docs.length})</span>
              <a href="/documents" className="btn btn-ghost btn-sm">Manage Docs →</a>
            </div>
            {docs.length === 0 ? (
              <div className="empty" style={{ padding:24 }}>
                <div className="empty-icon">📄</div>
                <div className="empty-title">No documents uploaded</div>
                <a href="/documents" className="btn btn-ghost btn-sm">Upload Documents</a>
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Document</th><th>Type</th><th>Expiry</th><th>Action</th></tr></thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontSize:13 }}>{d.name}</td>
                      <td><span className="badge badge-blue" style={{ fontSize:11 }}>{d.type}</span></td>
                      <td style={{ fontSize:12, color:"var(--muted)" }}>{d.expiryDate || "—"}</td>
                      <td><a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="data-card" style={{ padding:24 }}>
            <div className="sora" style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Payer Summary</div>
            {[
              { label:"Total Payers",  val:cred.payers?.length || 0,  color:"var(--white)"  },
              { label:"Approved",      val:approvedPayers,             color:"var(--green)"  },
              { label:"Submitted",     val:submittedPayers,            color:"var(--yellow)" },
              { label:"Not Started",   val:(cred.payers?.length||0)-approvedPayers-submittedPayers, color:"var(--muted)" },
            ].map((r,i,arr) => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i<arr.length-1?"1px solid var(--border)":"none" }}>
                <span style={{ fontSize:13, color:"var(--muted)" }}>{r.label}</span>
                <span style={{ fontSize:18, fontWeight:800, fontFamily:"Sora,sans-serif", color:r.color }}>{r.val}</span>
              </div>
            ))}
          </div>

          <div className="data-card" style={{ padding:24 }}>
            <div className="sora" style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Quick Links</div>
            {[
              { href:"/documents", label:"📄 Upload Documents" },
              { href:"/providers", label:"🏥 Back to Providers" },
              { href:"/credentialing", label:"📜 All Credentialing" },
            ].map((l,i) => (
              <a key={i} href={l.href} className="btn btn-ghost" style={{ justifyContent:"flex-start", marginBottom:8, width:"100%" }}>{l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
