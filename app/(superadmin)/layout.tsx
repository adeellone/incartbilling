"use client";
import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import { THEME } from "@/lib/theme";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSuperAdmin) router.push("/dashboard");
  }, [loading, isSuperAdmin, router]);

  if (loading) return (
    <>
      <style>{THEME}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--navy)", color: "var(--muted)" }}>Loading...</div>
    </>
  );

  if (!isSuperAdmin) return null;

  return (
    <>
      <style>{THEME}</style>
      <div className="dash-wrap">
        <Sidebar />
        <main className="dash-main">{children}</main>
      </div>
    </>
  );
}
