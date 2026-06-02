"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/firestore/users";
import { getPermissions } from "@/lib/permissions";

const ROLE_BADGE:Record<UserRole,{label:string;color:string}>={
  superadmin:{label:"Super Admin",color:"var(--cyan)"},
  company_admin:{label:"Company Admin",color:"var(--blue2)"},
  billing_staff:{label:"Billing Staff",color:"var(--muted)"},
  provider:{label:"Provider",color:"var(--green)"},
};

export default function Sidebar() {
  const pathname=usePathname();
  const router=useRouter();
  const {user,profile,logout}=useAuth();

  const role=profile?.role??"billing_staff";
  const badge=ROLE_BADGE[role];
  const initials=user?.displayName?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"IB";

  // Get effective permissions (custom overrides role defaults)
  const basePerms=getPermissions(role);
  const perms={...basePerms,...(profile?.customPermissions||{})};

  const isActive=(href:string)=>pathname===href||pathname.startsWith(href+"/");

  const Link=({href,icon,label}:{href:string;icon:string;label:string})=>(
    <a href={href} className={`sidebar-link${isActive(href)?" active":""}`}>
      <span className="icon">{icon}</span>{label}
    </a>
  );

  return(
    <aside className="sidebar">
      <div className="sidebar-logo">Incart<span>Billing</span></div>

      {role==="superadmin"&&(
        <>
          <div className="sidebar-section">SUPER ADMIN</div>
          <Link href="/admin" icon="🌐" label="All Companies"/>
          <Link href="/admin/users" icon="👥" label="All Users"/>
          <Link href="/admin/requests" icon="📬" label="Demo Requests"/>
          <div className="sidebar-section">PLATFORM</div>
          <Link href="/dashboard" icon="📊" label="Dashboard"/>
          <Link href="/claims" icon="📋" label="Claims"/>
          <Link href="/reports" icon="📈" label="Reports"/>
        </>
      )}

      {role==="provider"&&(
        <>
          <div className="sidebar-section">MY PRACTICE</div>
          <Link href="/provider-portal" icon="📊" label="My Dashboard"/>
          <Link href="/provider-portal/claims" icon="📋" label="My Claims"/>
          <Link href="/provider-portal/payments" icon="💰" label="My Payments"/>
        </>
      )}

      {(role==="company_admin"||role==="billing_staff")&&(
        <>
          {role==="company_admin"&&(
            <>
              <div className="sidebar-section">MANAGEMENT</div>
              <Link href="/company" icon="🏢" label="My Company"/>
              {perms.canViewTeam&&<Link href="/team" icon="👥" label="Team Members"/>}
            </>
          )}

          <div className="sidebar-section">BILLING</div>
          <Link href="/dashboard" icon="📊" label="Dashboard"/>
          {perms.canViewClaims&&<Link href="/claims" icon="📋" label="Claims"/>}
          {perms.canViewPatients&&<Link href="/patients" icon="👤" label="Patients"/>}
          {perms.canViewProviders&&<Link href="/providers" icon="🏥" label="Providers"/>}

          {(perms.canViewCredentialing||perms.canViewDocuments)&&(
            <>
              <div className="sidebar-section">CREDENTIALING</div>
              {perms.canViewCredentialing&&<Link href="/credentialing" icon="📜" label="Credentialing"/>}
              {perms.canViewDocuments&&<Link href="/documents" icon="📄" label="Documents"/>}
            </>
          )}

          <div className="sidebar-section">FINANCE</div>
          {perms.canViewPayments&&<Link href="/payments" icon="💰" label="Payments"/>}
          {perms.canViewDenials&&<Link href="/denials" icon="🚫" label="Denials"/>}
          {perms.canViewReports&&<Link href="/reports" icon="📈" label="Reports"/>}
        </>
      )}

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="user-name" style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.displayName||"User"}</div>
            <div className="user-role" style={{color:badge.color}}>{badge.label}</div>
          </div>
          <button onClick={async()=>{await logout();router.push("/login");}} title="Logout"
            style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:16}}>⏻</button>
        </div>
      </div>
    </aside>
  );
}
