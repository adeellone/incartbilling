"use client";
import { useState, FormEvent } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { THEME } from "@/lib/theme";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", size: "1-5 providers", message: "" });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true);
    await addDoc(collection(db, "demo_requests"), { ...form, createdAt: serverTimestamp() });
    setSent(true); setLoading(false);
  };

  return (
    <>
      <style>{THEME}</style>
      <style>{`
        .contact-wrap { min-height:100vh; display:flex; background:var(--navy); }
        .contact-left { flex:1; padding:80px 60px; display:flex; flex-direction:column; justify-content:center; background:rgba(27,111,235,0.06); border-right:1px solid var(--border); }
        .contact-right { flex:1; padding:80px 60px; display:flex; align-items:center; justify-content:center; }
        .contact-title { font-family:'Sora',sans-serif; font-size:36px; font-weight:800; letter-spacing:-1px; margin-bottom:16px; }
        .contact-sub { font-size:16px; color:var(--muted); line-height:1.7; margin-bottom:40px; }
        .benefit { display:flex; gap:14px; margin-bottom:20px; align-items:flex-start; }
        .benefit-icon { font-size:22px; margin-top:2px; }
        .benefit-title { font-size:15px; font-weight:600; margin-bottom:4px; }
        .benefit-desc { font-size:13px; color:var(--muted); }
        @media(max-width:800px){ .contact-wrap{flex-direction:column;} .contact-left{padding:40px 24px;} .contact-right{padding:24px;} }
      `}</style>
      <div className="contact-wrap">

        {/* Left */}
        <div className="contact-left">
          <a href="/" style={{ color:"var(--muted)", fontSize:14, textDecoration:"none", marginBottom:40, display:"block" }}>← Back to home</a>
          <div className="auth-logo" style={{ marginBottom:24 }}>Incart<span style={{ WebkitTextFillColor:"#3D8EFF" }}>Billing</span></div>
          <h1 className="contact-title sora">Request a free demo</h1>
          <p className="contact-sub">Our team will walk you through the platform and build a custom plan for your practice or billing company.</p>
          {[
            { icon:"⚡", title:"Response in 24 hours", desc:"Our sales team replies within one business day" },
            { icon:"🎯", title:"Custom onboarding plan", desc:"Tailored to your specialty and team size" },
            { icon:"💰", title:"Flexible pricing", desc:"Per-provider, % of collections, or flat monthly fee" },
            { icon:"🔒", title:"HIPAA compliant", desc:"Your data is always secure and private" },
          ].map((b, i) => (
            <div className="benefit" key={i}>
              <div className="benefit-icon">{b.icon}</div>
              <div>
                <div className="benefit-title">{b.title}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right */}
        <div className="contact-right">
          {sent ? (
            <div style={{ textAlign:"center", maxWidth:360 }}>
              <div style={{ fontSize:56, marginBottom:20 }}>✅</div>
              <h2 className="sora" style={{ fontSize:26, fontWeight:800, marginBottom:12 }}>Request received!</h2>
              <p style={{ color:"var(--muted)", marginBottom:32 }}>Our team will reach out within 24 hours to schedule your demo.</p>
              <a href="/" className="btn btn-blue">← Back to home</a>
            </div>
          ) : (
            <div className="panel" style={{ maxWidth:440, width:"100%" }}>
              <div className="panel-title sora">Tell us about your practice</div>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">YOUR NAME</label>
                    <input className="form-input" placeholder="Dr. John Smith" value={form.name} onChange={set("name")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">COMPANY / PRACTICE</label>
                    <input className="form-input" placeholder="ABC Medical" value={form.company} onChange={set("company")} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">EMAIL</label>
                    <input className="form-input" type="email" placeholder="you@practice.com" value={form.email} onChange={set("email")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PHONE</label>
                    <input className="form-input" placeholder="+1 555 000 0000" value={form.phone} onChange={set("phone")} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">PRACTICE SIZE</label>
                  <select className="form-select" value={form.size} onChange={set("size")}>
                    {["1-5 providers","6-20 providers","21-50 providers","50+ providers","Billing company"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">MESSAGE (OPTIONAL)</label>
                  <textarea className="form-input" rows={3} placeholder="Tell us about your current billing challenges..." value={form.message} onChange={set("message")} style={{ resize:"vertical" }} />
                </div>
                <div style={{ marginTop:8 }} />
                <button className="btn btn-blue btn-full" type="submit" disabled={loading} style={{ padding:14 }}>
                  {loading ? "Submitting..." : "Request Demo →"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
