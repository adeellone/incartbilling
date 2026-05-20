"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { THEME } from "@/lib/theme";

function parseError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use":   "Email already registered. Please login.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/invalid-email":          "Invalid email address.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/operation-not-allowed":  "Enable Email/Password in Firebase Console → Authentication.",
  };
  return map[code] || `Error: ${code}`;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.name.trim())              { setError("Full name required."); return; }
    if (!form.company.trim())           { setError("Company / practice name required."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6)       { setError("Min 6 characters."); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name.trim(), form.company.trim());
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(parseError((err as { code?: string }).code || ""));
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{THEME}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">Incart<span style={{ WebkitTextFillColor: "#3D8EFF" }}>Billing</span></div>
          <h1 className="auth-title sora">Create your account</h1>
          <p className="auth-sub">Free trial — no credit card required</p>
          {error && <div className="err">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">YOUR NAME</label>
                <input className="form-input" placeholder="Dr. John Smith" value={form.name} onChange={set("name")} required />
              </div>
              <div className="form-group">
                <label className="form-label">COMPANY / PRACTICE</label>
                <input className="form-input" placeholder="ABC Billing Co." value={form.company} onChange={set("company")} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <input className="form-input" type="password" placeholder="Min 6 chars" value={form.password} onChange={set("password")} required />
              </div>
              <div className="form-group">
                <label className="form-label">CONFIRM</label>
                <input className="form-input" type="password" placeholder="Repeat" value={form.confirm} onChange={set("confirm")} required />
              </div>
            </div>
            <div style={{ marginBottom: 20 }} />
            <button className="btn btn-blue btn-full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>
          <div className="auth-link">Already have an account? <a href="/login">Sign in</a></div>
          <div className="auth-link" style={{ marginTop: 8 }}>
            <a href="/" style={{ color: "var(--muted)" }}>← Back to home</a>
          </div>
        </div>
      </div>
    </>
  );
}
