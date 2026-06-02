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
    // Role-based redirect only on exact /dashboard
    if (profile && pathname === "/dashboard") {
      if (profile.role === "superadmin")  { router.push("/admin"); return; }
      if (profile.role === "provider")    { router.push("/provider-portal"); return; }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading || !user) return (
    <>
      <style>{THEME}</style>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--navy)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"Sora,sans-serif", fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#fff,#00D4FF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:10 }}>
            IncartBilling
          </div>
          <div style={{ color:"var(--muted)", fontSize:13 }}>Loading...</div>
        </div>
      </div>
    </>
  );

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
