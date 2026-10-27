import { useState } from "react";
import { ArrowRight, Cloud, Code, Database, Globe, Lock } from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/States";
import { navigate, useLoad } from "../hooks";

const ICONS: Record<string, typeof Code> = { python: Code, globe: Globe, database: Database, cloud: Cloud };

export default function SubjectsPage() {
  const { data, error, loading, reload, setData } = useLoad(api.subjects);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (loading) return <Loading label="Loading subjects…" />;
  if (error || !data) return <ErrorBox message={error ?? "No data"} onRetry={reload} />;

  const select = async (id: string) => {
    setSaving(id);
    setSaveError(null);
    try {
      const s = await api.selectSubject(id);
      setData({ ...data, selected_subject_id: s.id });
      setSaved(true);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Choose your subject</h1>
          <p className="muted">Your choice is saved to your profile. Python Programming is fully available in this edition.</p>
        </div>
        {saved && (
          <button className="btn btn-primary" onClick={() => navigate("assessment")}>
            Start assessment <ArrowRight size={15} aria-hidden />
          </button>
        )}
      </header>
      {saveError && <ErrorBox message={saveError} />}
      {saved && <div className="alert alert-success" role="status">Subject saved. You're ready for the 5-question assessment.</div>}

      <div className="subject-grid">
        {data.subjects.map((s) => {
          const Icon = ICONS[s.icon] ?? Code;
          const selected = data.selected_subject_id === s.id;
          return (
            <article key={s.id} className={`card subject ${selected ? "selected" : ""} ${s.is_active ? "" : "disabled"}`}>
              <div className="subject-icon"><Icon size={24} aria-hidden /></div>
              <h2>{s.title}</h2>
              <p className="muted">{s.description}</p>
              <div className="subject-meta">
                {s.is_active ? (
                  <span className="badge">{s.question_count} questions · {s.difficulty}</span>
                ) : (
                  <span className="badge badge-soon"><Lock size={12} aria-hidden /> Coming soon</span>
                )}
              </div>
              <button
                className={`btn btn-block ${selected ? "btn-ghost" : "btn-primary"}`}
                disabled={!s.is_active || saving !== null}
                onClick={() => select(s.id)}
                aria-pressed={selected}
              >
                {!s.is_active ? "Not available yet" : saving === s.id ? "Saving…" : selected && saved ? "Selected ✓" : "Select subject"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
