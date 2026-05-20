"use client";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import { THEME } from "@/lib/theme";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }

    // Role-based redirect on first login
    if (profile?.role === "superadmin" && pathname === "/dashboard") {
      router.push("/admin"); return;
    }
    if (profile?.role === "provider" && pathname === "/dashboard") {
      router.push("/provider-portal"); return;
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) return (
    <>
      <style>{THEME}</style>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--navy)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"Sora,sans-serif", fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#fff,#00D4FF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:10 }}>
            IncartBilling
          </div>
          <div style={{ color:"var(--muted)", fontSize:13 }}>Loading your dashboard...</div>
        </div>
      </div>
    </>
  );

  if (!user) return null;

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
