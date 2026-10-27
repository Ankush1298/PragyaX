import { LoaderCircle, TriangleAlert, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={22} aria-hidden /> {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-error" role="alert">
      <TriangleAlert size={18} aria-hidden />
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          <RotateCcw size={14} aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  );
}

export function DemoBadge({ label = "Demo AI" }: { label?: string }) {
  return (
    <span className="badge badge-demo" title="Responses come from the offline deterministic mock provider, not a live AI model.">
      {label}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function levelClass(level: string) {
  return `badge level-${level.toLowerCase().replace(/\s+/g, "-")}`;
}

export const formatDate = (s?: string | null) => {
  if (!s) return "";
  // SQLite CURRENT_TIMESTAMP is UTC without a zone marker.
  const d = new Date(s.includes("T") || s.endsWith("Z") ? s : `${s.replace(" ", "T")}Z`);
  return isNaN(d.getTime()) ? s : d.toLocaleString();
};
