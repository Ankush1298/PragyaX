import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Flame,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  category: "reminder" | "battle" | "challenge" | "achievement";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRoute?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "battle",
    title: "1v1 Battle Invitation",
    message: "Asha S. challenged you to a 45-second Python Async Battle!",
    timestamp: "10 mins ago",
    read: false,
    actionRoute: "battles",
  },
  {
    id: "notif-2",
    category: "challenge",
    title: "Daily Code Breaker Deadline Approaching",
    message: "Today's challenge expires in 4 hours. Solve it to preserve your 6-day streak!",
    timestamp: "1 hour ago",
    read: false,
    actionRoute: "challenge",
  },
  {
    id: "notif-3",
    category: "achievement",
    title: "Achievement Unlocked: Python Slicer",
    message: "You scored 100% on sequence manipulation in the diagnostic assessment (+50 XP).",
    timestamp: "Yesterday",
    read: true,
    actionRoute: "rewards",
  },
  {
    id: "notif-4",
    category: "reminder",
    title: "Daily Study Mission",
    message: "Recommended next action: review Generator Expressions in Structured Lessons.",
    timestamp: "2 days ago",
    read: true,
    actionRoute: "lessons",
  },
];

interface NotificationsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onNavigate?: (route: string) => void;
}

export function NotificationsModal({ isOpen, onClose, onNavigate }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "settings">("all");

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [battleInvites, setBattleInvites] = useState(true);
  const [streakWarnings, setStreakWarnings] = useState(true);
  const [reminderTime, setReminderTime] = useState("19:00");

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifs =
    activeTab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getCategoryIcon = (cat: NotificationItem["category"]) => {
    switch (cat) {
      case "battle":
        return <Swords size={16} color="#d97706" />;
      case "challenge":
        return <Zap size={16} color="var(--color-indigo)" />;
      case "achievement":
        return <Trophy size={16} color="#16a34a" />;
      case "reminder":
      default:
        return <Clock size={16} color="var(--color-charcoal-muted)" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          height: "100%",
          borderRadius: 0,
          borderLeft: "1px solid var(--border-light)",
          background: "white",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={18} color="var(--color-indigo)" />
            <h2 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 700 }}>
              Notification Center
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 10,
                  background: "var(--color-indigo)",
                  color: "white",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close notification panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comeback Streak Banner */}
        <div
          style={{
            padding: "10px 16px",
            background: "#fff7ed",
            borderBottom: "1px solid #fed7aa",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Flame size={20} color="#ea580c" />
          <div style={{ fontSize: "0.82rem", color: "#9a3412", lineHeight: 1.35 }}>
            <strong>Welcome back!</strong> Maintain your 6-day streak by completing one practice session today.
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            padding: "8px 16px",
            borderBottom: "1px solid var(--border-light)",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={`btn btn-sm ${activeTab === "all" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("all")}
              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${activeTab === "unread" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("unread")}
              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`btn btn-sm ${activeTab === "settings" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("settings")}
              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            >
              <Settings size={13} />
            </button>
          </div>

          {unreadCount > 0 && activeTab !== "settings" && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={markAllAsRead}
              style={{ fontSize: "0.76rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {activeTab === "settings" ? (
            /* Notification Preferences Form */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: "0.96rem", fontWeight: 700, margin: 0 }}>
                Notification Preferences
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.86rem", cursor: "pointer" }}>
                  <span>Daily Study Reminders</span>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.86rem", cursor: "pointer" }}>
                  <span>Incoming 1v1 Battle Invites</span>
                  <input
                    type="checkbox"
                    checked={battleInvites}
                    onChange={(e) => setBattleInvites(e.target.checked)}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.86rem", cursor: "pointer" }}>
                  <span>Streak Expiry Warnings</span>
                  <input
                    type="checkbox"
                    checked={streakWarnings}
                    onChange={(e) => setStreakWarnings(e.target.checked)}
                  />
                </label>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Preferred Daily Reminder Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10, padding: 10, background: "var(--color-ice-silver)", borderRadius: 6, fontSize: "0.78rem" }}>
                <Sparkles size={14} color="var(--color-indigo)" style={{ display: "inline", marginRight: 4 }} />
                Preferences are saved locally and synced with your learner profile.
              </div>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <Check size={32} color="var(--color-charcoal-muted)" style={{ margin: "0 auto 8px" }} />
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                You're all caught up! No notifications to display.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredNotifs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markAsRead(item.id);
                    if (item.actionRoute && onNavigate) {
                      onNavigate(item.actionRoute);
                      onClose();
                    }
                  }}
                  style={{
                    padding: 12,
                    borderRadius: "var(--radius)",
                    border: item.read ? "1px solid var(--border-light)" : "1px solid var(--color-indigo)",
                    background: item.read ? "white" : "var(--color-ice-silver)",
                    cursor: "pointer",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "white",
                      border: "1px solid var(--border-light)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(item.category)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.86rem", color: "var(--color-navy)" }}>
                        {item.title}
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-charcoal-muted)" }}>
                        {item.timestamp}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--color-charcoal-muted)", lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
