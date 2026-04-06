import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";

type NotifType = "info" | "success" | "warning" | "update" | "promo";
type FilterType = "all" | "unread";

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; bg: string }> = {
  info:    { icon: "ℹ️", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  success: { icon: "✅", color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  warning: { icon: "⚠️", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  update:  { icon: "🔄", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  promo:   { icon: "🎁", color: "#F97316", bg: "rgba(249,115,22,0.08)" },
};

export default function Notifications() {
  const { t } = useTranslation();
  function timeAgo(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return t("notifications.justNow", "Just now");
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t("notifications.minAgo", "min ago")}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("notifications.hAgo", "h ago")}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("notifications.daysAgoShort", "days ago")}`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  const [filter, setFilter] = useState<FilterType>("all");
  const utils = trpc.useUtils();

  const { data: notifications = [], isLoading } = trpc.notifications.inApp.list.useQuery({ limit: 100 });

  const markRead = trpc.notifications.inApp.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.inApp.list.invalidate();
      utils.notifications.inApp.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.inApp.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.inApp.list.invalidate();
      utils.notifications.inApp.unreadCount.invalidate();
    },
  });

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotifClick = (notif: typeof notifications[0]) => {
    if (!notif.isRead) {
      markRead.mutate({ id: notif.id });
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  return (
    <AppLayout title={t("notifications.title", "Notifications")} showBack>
      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "8px", background: "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "4px" }}>
            {(["all", "unread"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: filter === f ? 700 : 500,
                  background: filter === f ? "white" : "transparent",
                  color: filter === f ? "#F97316" : "#6B7280",
                  boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {f === "all" ? t("notifications.all", "All") : `${t("notifications.unread", "Unread")}${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </button>
            ))}
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1.5px solid rgba(249,115,22,0.3)",
                background: "transparent",
                color: "#F97316",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                opacity: markAllRead.isPending ? 0.6 : 1,
              }}
            >
              {markAllRead.isPending ? "..." : t("notifications.markAll", "Mark all")}
            </button>
          )}
        </div>

        {/* Notification list */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "80px", borderRadius: "16px", background: "rgba(0,0,0,0.05)", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔔</div>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>
              {filter === "unread" ? t("notifications.upToDate", "All up to date") : t("notifications.empty", "No notifications")}
            </p>
            <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
              {filter === "unread"
                ? t("notifications.noPending", "You have no pending notifications to read.")
                : t("notifications.willAppear", "Your notifications will appear here when available.")}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type as NotifType] ?? TYPE_CONFIG.info;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    background: notif.isRead ? "white" : cfg.bg,
                    border: `1.5px solid ${notif.isRead ? "rgba(0,0,0,0.06)" : cfg.color + "30"}`,
                    cursor: notif.link || !notif.isRead ? "pointer" : "default",
                    transition: "all 0.2s",
                    boxShadow: notif.isRead ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}>
                    {notif.imageUrl
                      ? <img src={notif.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                      : cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <p style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: notif.isRead ? 600 : 800,
                        color: "#1a1a1a",
                        lineHeight: 1.3,
                      }}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316", flexShrink: 0, marginTop: "4px" }} />
                      )}
                    </div>
                    <p style={{
                      margin: "4px 0 0",
                      fontSize: "13px",
                      color: "#6B7280",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {notif.body}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer disclaimer */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#d1d5db", margin: 0 }}>
            {t("notifications.disclaimer", "BuddyMarket · Notifications do not constitute professional recommendations")}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
