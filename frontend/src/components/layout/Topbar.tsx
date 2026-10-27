import { useState } from "react";
import { Bell, GraduationCap, Menu, X } from "lucide-react";
import type { User } from "../../types/api";
import { NotificationsModal } from "./NotificationsModal";
import { navigate } from "../../routes/router";

interface TopbarProps {
  readonly user: User;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

export function Topbar({ user, isOpen, onToggle }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggle}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <a href="#/dashboard" className="brand">
            <GraduationCap size={22} aria-hidden /> Pragya<span className="brand-x">X</span>
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Notification Center Trigger */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowNotifications(true)}
            aria-label="Open notifications"
            style={{ position: "relative" }}
          >
            <Bell size={19} />
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
          </button>

          <div
            className="avatar"
            style={{ width: 30, height: 30, fontSize: "0.8rem", cursor: "pointer" }}
            title={`${user.name} (${user.email})`}
            aria-hidden
            onClick={() => navigate("profile")}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigate={(route) => navigate(route)}
      />
    </>
  );
}

export default Topbar;
