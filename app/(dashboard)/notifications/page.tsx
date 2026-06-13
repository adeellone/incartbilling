"use client";
import { useNotifications } from "@/hooks/useNotifications";
import { useReady } from "@/hooks/useReady";

const TYPE_ICON: Record<string, string> = {
  claim_status:       "📋",
  denial_logged:      "🚫",
  payment_posted:     "💰",
  credential_expiring:"⚠️",
  credential_expired: "⛔",
  document_expiring:  "⚠️",
  document_expired:   "⛔",
  team_member_added:  "👥",
};

const TYPE_COLOR: Record<string, string> = {
  claim_status:       "var(--blue2)",
  denial_logged:      "var(--red)",
  payment_posted:     "var(--green)",
  credential_expiring:"var(--yellow)",
  credential_expired: "var(--red)",
  document_expiring:  "var(--yellow)",
  document_expired:   "var(--red)",
  team_member_added:  "var(--cyan)",
};

function timeAgo(ts?: { seconds?: number }): string {
  if (!ts?.seconds) return "";
  const diff = Math.floor(Date.now() / 1000) - ts.seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { ready } = useReady();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  if (!ready) return (
    <div className="dash-content" style={{ textAlign: "center", paddingTop: 80, color: "var(--muted)" }}>
      Loading...
    </div>
  );

  return (
    <div className="dash-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="sora" style={{ fontSize: 24, fontWeight: 800 }}>
            Notifications
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {unreadCount > 0 ? (
              <span style={{ color: "var(--blue2)", fontWeight: 600 }}>
                {unreadCount} unread
              </span>
            ) : (
              "All caught up"
            )}
            <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              Live
            </span>
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}>
        {[
          { label: "Total",   val: notifications.length,                                              color: "var(--white)"  },
          { label: "Unread",  val: unreadCount,                                                       color: "var(--blue2)"  },
          { label: "Denials", val: notifications.filter(n => n.type === "denial_logged").length,      color: "var(--red)"    },
          { label: "Expiring",val: notifications.filter(n => n.type.includes("expiring")).length,     color: "var(--yellow)" },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-val" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <span className="data-card-title sora">All Notifications</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{notifications.length} total</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">No notifications yet</div>
            <div className="empty-sub">
              Notifications appear when claims change status, payments are posted, denials are logged, or credentials are expiring.
            </div>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border)",
                  background: n.read ? "transparent" : "rgba(27,111,235,0.04)",
                  cursor: n.link ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onClick={() => {
                  if (!n.read && n.id) markRead(n.id);
                  if (n.link) window.location.href = n.link;
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${TYPE_COLOR[n.type] || "var(--blue2)"}18`,
                  border: `1px solid ${TYPE_COLOR[n.type] || "var(--blue2)"}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {TYPE_ICON[n.type] || "🔔"}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: n.read ? 500 : 700,
                      color: "var(--white)",
                    }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--blue2)",
                        display: "inline-block",
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", opacity: 0.6 }}>
                    {timeAgo(n.createdAt as { seconds?: number })}
                  </div>
                </div>

                {/* Action */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (n.id) markRead(n.id);
                      }}
                    >
                      Mark read
                    </button>
                  )}
                  {n.link && (
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>→</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
