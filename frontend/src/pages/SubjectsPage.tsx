import { useState } from "react";
import {
  ArrowRight,
  Atom,
  BrainCircuit,
  Briefcase,
  Calculator,
  Cloud,
  Code,
  Cpu,
  Database,
  Dna,
  FileUp,
  FlaskConical,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/States";
import { navigate, useLoad } from "../hooks";

const ICONS: Record<string, typeof Code> = {
  python: Code,
  code: Code,
  calculator: Calculator,
  math: Calculator,
  atom: Atom,
  physics: Atom,
  "flask-conical": FlaskConical,
  chemistry: FlaskConical,
  dna: Dna,
  biology: Dna,
  globe: Globe,
  database: Database,
  cloud: Cloud,
  cpu: Cpu,
  brain: BrainCircuit,
  briefcase: Briefcase,
};

// Additional academic tracks per Section 7
const CATALOG_PREVIEWS = [
  {
    id: "prev_ai",
    slug: "ai",
    title: "Artificial Intelligence",
    description: "Search algorithms, heuristic state spaces, knowledge representation, and agent architectures.",
    icon: "brain",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_ml",
    slug: "ml",
    title: "Machine Learning",
    description: "Loss functions, gradient descent, classification, regression, and model evaluation metrics.",
    icon: "cpu",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_dsa",
    slug: "dsa",
    title: "Data Structures & Algorithms",
    description: "Trees, graphs, dynamic programming, asymptotic complexity (Big-O), and sorting networks.",
    icon: "binary",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_cpp",
    slug: "cpp",
    title: "C and C++ Systems Programming",
    description: "Pointers, memory allocation, RAII, move semantics, and low-level runtime execution.",
    icon: "code",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_java",
    slug: "java",
    title: "Java Object-Oriented Architecture",
    description: "JVM memory model, garbage collection, interfaces, polymorphism, and concurrency.",
    icon: "file-code",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_networks",
    slug: "networks",
    title: "Computer Networks & Protocols",
    description: "OSI and TCP/IP models, routing protocols, socket programming, and packet mechanics.",
    icon: "globe",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_biz",
    slug: "business",
    title: "Business & Entrepreneurship",
    description: "Market validation, unit economics, lean canvas, and financial modeling for tech ventures.",
    icon: "briefcase",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
  {
    id: "prev_comm",
    slug: "english",
    title: "English & Technical Communication",
    description: "Scientific writing, technical documentation, rhetoric, and engineering peer communication.",
    icon: "message-square",
    is_active: false,
    question_count: 5,
    difficulty: "Catalog Preview",
  },
];

export default function SubjectsPage() {
  const { data, error, loading, reload, setData } = useLoad(api.subjects);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (loading) return <Loading label="Loading subject catalog…" />;
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

  const selectedSubject = data.subjects.find((s) => s.id === data.selected_subject_id);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <Sparkles size={13} aria-hidden />
            <span>Multi-Subject Learning Catalog</span>
          </div>
          <h1>Choose your subject track</h1>
          <p className="muted">
            Select your active domain. Python Programming, Mathematics, Physics, Chemistry, and
            Biology are fully active with server-evaluated diagnostic assessments.
          </p>
        </div>

        {selectedSubject && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => navigate("syllabus")}>
              <FileUp size={15} /> Upload Syllabus / Enter Topic
            </button>
            <button className="btn btn-primary" onClick={() => navigate("assessment")}>
              Start Assessment <ArrowRight size={15} />
            </button>
          </div>
        )}
      </header>

      {saveError && <ErrorBox message={saveError} />}

      {saved && selectedSubject && (
        <div className="alert alert-success" role="status" style={{ marginBottom: 24 }}>
          <div>
            <strong>Active track updated to {selectedSubject.title}!</strong>
            <p style={{ margin: "4px 0 8px 0" }}>
              Your learning roadmap, question bank, and AI tutor are now configured for this subject.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate("syllabus")}
              >
                Start Learning (Syllabus / Topic Entry)
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("assessment")}
              >
                Take 5-Question Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Primary Tracks */}
      <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Core Active Subjects (Fully Enabled)</h2>
      <div className="subject-grid" style={{ marginBottom: 36 }}>
        {data.subjects.map((s) => {
          const Icon = ICONS[s.icon] ?? ICONS[s.slug] ?? Code;
          const selected = data.selected_subject_id === s.id;

          return (
            <article
              key={s.id}
              className={`card subject ${selected ? "selected" : ""} ${s.is_active ? "" : "disabled"}`}
            >
              <div className="subject-icon">
                <Icon size={24} aria-hidden />
              </div>
              <h2>{s.title}</h2>
              <p className="muted">{s.description}</p>
              <div className="subject-meta">
                {s.is_active ? (
                  <span className="badge badge-accent">
                    {s.question_count} questions · {s.difficulty}
                  </span>
                ) : (
                  <span className="badge badge-soon">
                    <Lock size={12} aria-hidden /> Coming soon
                  </span>
                )}
              </div>
              <button
                type="button"
                className={`btn btn-block ${selected ? "btn-ghost" : "btn-primary"}`}
                disabled={!s.is_active || saving !== null}
                onClick={() => select(s.id)}
                aria-pressed={selected}
              >
                {!s.is_active
                  ? "Not available yet"
                  : saving === s.id
                  ? "Saving…"
                  : selected
                  ? "Active Track ✓"
                  : "Select Subject"}
              </button>
            </article>
          );
        })}
      </div>

      {/* Additional Previews */}
      <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>
        Advanced & Technical Curriculum Tracks (Preview)
      </h2>
      <p className="muted small" style={{ marginBottom: 16 }}>
        Curriculum frameworks and diagnostic question sets for these tracks are currently being
        calibrated.
      </p>

      <div className="subject-grid">
        {CATALOG_PREVIEWS.map((prev) => {
          const Icon = ICONS[prev.icon] ?? Code;
          return (
            <article key={prev.id} className="card subject disabled" style={{ opacity: 0.85 }}>
              <div className="subject-icon">
                <Icon size={24} aria-hidden />
              </div>
              <h2>{prev.title}</h2>
              <p className="muted">{prev.description}</p>
              <div className="subject-meta">
                <span className="badge badge-soon">
                  <Lock size={12} aria-hidden /> {prev.difficulty}
                </span>
              </div>
              <button type="button" className="btn btn-ghost btn-block" disabled>
                Catalog Preview
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
