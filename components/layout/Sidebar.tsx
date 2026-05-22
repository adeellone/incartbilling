"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/firestore/users";

const NAV_BY_ROLE: Record<UserRole, { section?: string; href?: string; icon?: string; label?: string }[]> = {
  superadmin: [
    { section: "SUPER ADMIN" },
    { href: "/admin",           icon: "🌐", label: "All Companies"   },
    { href: "/admin/users",     icon: "👥", label: "All Users"       },
    { href: "/admin/requests",  icon: "📬", label: "Demo Requests"   },
    { section: "PLATFORM" },
    { href: "/dashboard",       icon: "📊", label: "Dashboard"       },
    { href: "/claims",          icon: "📋", label: "Claims"          },
    { href: "/reports",         icon: "📈", label: "Reports"         },
  ],
  company_admin: [
    { section: "MANAGEMENT" },
    { href: "/company",         icon: "🏢", label: "My Company"      },
    { href: "/team",            icon: "👥", label: "Team Members"    },
    { section: "BILLING" },
    { href: "/dashboard",       icon: "📊", label: "Dashboard"       },
    { href: "/claims",          icon: "📋", label: "Claims"          },
    { href: "/patients",        icon: "👤", label: "Patients"        },
    { href: "/providers",       icon: "🏥", label: "Providers"       },
    { section: "CREDENTIALING" },
    { href: "/credentialing",   icon: "📜", label: "Credentialing"   },
    { href: "/documents",       icon: "📄", label: "Documents"       },
    { section: "FINANCE" },
    { href: "/payments",        icon: "💰", label: "Payments"        },
    { href: "/denials",         icon: "🚫", label: "Denials"         },
    { href: "/reports",         icon: "📈", label: "Reports"         },
  ],
  billing_staff: [
    { section: "BILLING" },
    { href: "/dashboard",       icon: "📊", label: "Dashboard"       },
    { href: "/claims",          icon: "📋", label: "Claims"          },
    { href: "/patients",        icon: "👤", label: "Patients"        },
    { href: "/providers",       icon: "🏥", label: "Providers"       },
    { section: "CREDENTIALING" },
    { href: "/credentialing",   icon: "📜", label: "Credentialing"   },
    { href: "/documents",       icon: "📄", label: "Documents"       },
    { section: "FINANCE" },
    { href: "/payments",        icon: "💰", label: "Payments"        },
    { href: "/denials",         icon: "🚫", label: "Denials"         },
    { href: "/reports",         icon: "📈", label: "Reports"         },
  ],
  provider: [
    { section: "MY PRACTICE" },
    { href: "/provider-portal",          icon: "📊", label: "My Dashboard" },
    { href: "/provider-portal/claims",   icon: "📋", label: "My Claims"    },
    { href: "/provider-portal/payments", icon: "💰", label: "My Payments"  },
  ],
};

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  superadmin:    { label: "Super Admin",   color: "var(--cyan)"  },
  company_admin: { label: "Company Admin", color: "var(--blue2)" },
  billing_staff: { label: "Billing Staff", color: "var(--muted)" },
  provider:      { label: "Provider",      color: "var(--green)" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, profile, logout } = useAuth();

  const role    = profile?.role ?? "billing_staff";
  const nav     = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.billing_staff;
  const badge   = ROLE_BADGE[role];
  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "IB";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Incart<span>Billing</span></div>

      {nav.map((item, i) => {
        if ("section" in item && item.section)
          return <div className="sidebar-section" key={i}>{item.section}</div>;
        if ("href" in item && item.href) {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <a key={i} href={item.href} className={`sidebar-link${active ? " active" : ""}`}>
              <span className="icon">{item.icon}</span>{item.label}
            </a>
          );
        }
        return null;
      })}

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.displayName || "User"}
            </div>
            <div className="user-role" style={{ color: badge.color }}>{badge.label}</div>
          </div>
          <button onClick={async () => { await logout(); router.push("/login"); }} title="Logout"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
