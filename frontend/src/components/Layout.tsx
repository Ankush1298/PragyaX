import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  X,
  Zap,
} from "lucide-react";
import type { User } from "../api/types";
import { DemoBadge } from "./States";

const NAV = [
  { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "chat", label: "Learning Chat", icon: MessageSquare },
  { path: "subjects", label: "Subjects", icon: BookOpen },
  { path: "assessment", label: "Assessment", icon: ClipboardCheck },
  { path: "results", label: "My Results", icon: History },
  { path: "challenge", label: "Daily Challenge", icon: Zap },
];

interface Props {
  user: User;
  active: string;
  aiIsMock: boolean;
  onLogout: () => void;
  children: ReactNode;
}

export default function Layout({ user, active, aiIsMock, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);
  const current = active === "result" ? "results" : active;

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="brand">
          <GraduationCap size={22} aria-hidden /> Pragya<span className="brand-x">X</span>
        </span>
      </header>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand brand-lg">
          <GraduationCap size={26} aria-hidden /> Pragya<span className="brand-x">X</span>
        </div>
        <p className="tagline">From theory to practice</p>
        <nav aria-label="Main">
          {NAV.map(({ path, label, icon: Icon }) => (
            <a
              key={path}
              href={`#/${path}`}
              className={`nav-link ${current === path ? "active" : ""}`}
              aria-current={current === path ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} aria-hidden /> {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          {aiIsMock && <DemoBadge label="Demo AI mode" />}
          <div className="me">
            <div className="avatar" aria-hidden>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="me-text">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" onClick={onLogout}>
            <LogOut size={16} aria-hidden /> Log out
          </button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden />}

      <main className="content">{children}</main>
    </div>
  );
}
