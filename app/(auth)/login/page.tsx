"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { THEME } from "@/lib/theme";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{THEME}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">Incart<span style={{ WebkitTextFillColor: "#3D8EFF" }}>Billing</span></div>
          <h1 className="auth-title sora">Welcome back</h1>
          <p className="auth-sub">Sign in to your billing dashboard</p>

          {error && <div className="err">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">EMAIL ADDRESS</label>
              <input
                className="form-input" type="email" placeholder="you@practice.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">PASSWORD</label>
              <input
                className="form-input" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            <div style={{ marginBottom: 24 }} />
            <button className="btn btn-blue btn-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div className="auth-link">
            Don&apos;t have an account? <a href="/register">Create one</a>
          </div>
          <div className="auth-link" style={{ marginTop: 8 }}>
            <a href="/" style={{ color: "var(--muted)" }}>← Back to home</a>
          </div>
        </div>
      </div>
    </>
  );
}
