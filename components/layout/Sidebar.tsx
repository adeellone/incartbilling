"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/firestore/users";
import { getPermissions } from "@/lib/permissions";
import { useNotifications } from "@/hooks/useNotifications";
import { AppNotification } from "@/lib/firestore/notifications";

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  superadmin:    { label: "Super Admin",   color: "var(--cyan)"  },
  company_admin: { label: "Company Admin", color: "var(--blue2)" },
  billing_staff: { label: "Billing Staff", color: "var(--muted)" },
  provider:      { label: "Provider",      color: "var(--green)" },
};

const TYPE_ICON: Record<string, string> = {
  claim_status:        "📋",
  denial_logged:       "🚫",
  payment_posted:      "💰",
  credential_expiring: "⚠️",
  credential_expired:  "⛔",
  document_expiring:   "⚠️",
  document_expired:    "⛔",
  team_member_added:   "👥",
};

function timeAgo(ts?: { seconds?: number }): string {
  if (!ts?.seconds) return "";
  const diff = Math.floor(Date.now() / 1000) - ts.seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, profile, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  const role   = profile?.role ?? "billing_staff";
  const badge  = ROLE_BADGE[role];
  const initials = user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "IB";

  const basePerms = getPermissions(role);
  const perms = { ...basePerms, ...(profile?.customPermissions || {}) };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const NavLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
    <a href={href} className={`sidebar-link${isActive(href) ? " active" : ""}`}>
      <span className="icon">{icon}</span>{label}
    </a>
  );

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">Incart<span>Billing</span></div>

        {role === "superadmin" && (
          <>
            <div className="sidebar-section">SUPER ADMIN</div>
            <NavLink href="/admin"          icon="🌐" label="All Companies" />
            <NavLink href="/admin/users"    icon="👥" label="All Users" />
            <NavLink href="/admin/requests" icon="📬" label="Demo Requests" />
            <div className="sidebar-section">PLATFORM</div>
            <NavLink href="/dashboard" icon="📊" label="Dashboard" />
            <NavLink href="/claims"    icon="📋" label="Claims" />
            <NavLink href="/reports"   icon="📈" label="Reports" />
          </>
        )}

        {role === "provider" && (
          <>
            <div className="sidebar-section">MY PRACTICE</div>
            <NavLink href="/provider-portal"          icon="📊" label="My Dashboard" />
            <NavLink href="/provider-portal/claims"   icon="📋" label="My Claims" />
            <NavLink href="/provider-portal/payments" icon="💰" label="My Payments" />
          </>
        )}

        {(role === "company_admin" || role === "billing_staff") && (
          <>
            {role === "company_admin" && (
              <>
                <div className="sidebar-section">MANAGEMENT</div>
                <NavLink href="/company" icon="🏢" label="My Company" />
                {perms.canViewTeam && <NavLink href="/team" icon="👥" label="Team Members" />}
              </>
            )}

            <div className="sidebar-section">BILLING</div>
            <NavLink href="/dashboard" icon="📊" label="Dashboard" />
            {perms.canViewClaims    && <NavLink href="/claims"    icon="📋" label="Claims" />}
            {perms.canViewPatients  && <NavLink href="/patients"  icon="👤" label="Patients" />}
            {perms.canViewProviders && <NavLink href="/providers" icon="🏥" label="Providers" />}

            {(perms.canViewCredentialing || perms.canViewDocuments) && (
              <>
                <div className="sidebar-section">CREDENTIALING</div>
                {perms.canViewCredentialing && <NavLink href="/credentialing" icon="📜" label="Credentialing" />}
                {perms.canViewDocuments     && <NavLink href="/documents"     icon="📄" label="Documents" />}
              </>
            )}

            <div className="sidebar-section">FINANCE</div>
            {perms.canViewPayments && <NavLink href="/payments" icon="💰" label="Payments" />}
            {perms.canViewDenials  && <NavLink href="/denials"  icon="🚫" label="Denials" />}
            {perms.canViewReports  && <NavLink href="/reports"  icon="📈" label="Reports" />}
          </>
        )}

        {/* Bottom: user chip + bell */}
        <div className="sidebar-bottom">
          {/* Notification bell row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: "relative",
                background: showNotifications ? "rgba(27,111,235,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${showNotifications ? "var(--blue)" : "var(--border)"}`,
                borderRadius: 10,
                padding: "8px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--white)",
                fontSize: 13,
                fontWeight: 500,
                flex: 1,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 16 }}>🔔</span>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "var(--blue)",
                  color: "#fff",
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  minWidth: 18,
                  textAlign: "center",
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User chip */}
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.displayName || "User"}
              </div>
              <div className="user-role" style={{ color: badge.color }}>{badge.label}</div>
            </div>
            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              title="Logout"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Notification Drawer — overlays next to sidebar */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 49,
              background: "rgba(0,0,0,0.3)",
            }}
            onClick={() => setShowNotifications(false)}
          />

          {/* Drawer */}
          <div style={{
            position: "fixed",
            left: 240,
            top: 0,
            bottom: 0,
            width: 360,
            background: "var(--navy2)",
            borderRight: "1px solid var(--border)",
            zIndex: 51,
            display: "flex",
            flexDirection: "column",
            boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div className="sora" style={{ fontSize: 16, fontWeight: 700 }}>
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <div style={{ fontSize: 12, color: "var(--blue2)", marginTop: 2 }}>
                    {unreadCount} unread
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1 }}
                  onClick={() => setShowNotifications(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>All caught up!</div>
                  <div style={{ fontSize: 13 }}>No notifications yet</div>
                </div>
              ) : (
                notifications.map((n: AppNotification) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid var(--border)",
                      background: n.read ? "transparent" : "rgba(27,111,235,0.06)",
                      cursor: n.link ? "pointer" : "default",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                    onClick={() => {
                      if (!n.read && n.id) markRead(n.id);
                      if (n.link) {
                        setShowNotifications(false);
                        router.push(n.link);
                      }
                    }}
                  >
                    {/* icon */}
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                    }}>
                      {TYPE_ICON[n.type] || "🔔"}
                    </div>

                    {/* text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "var(--white)" }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue2)", flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", opacity: 0.5, marginTop: 4 }}>
                        {timeAgo(n.createdAt as { seconds?: number })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
              <a
                href="/notifications"
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                onClick={() => setShowNotifications(false)}
              >
                View all notifications →
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
