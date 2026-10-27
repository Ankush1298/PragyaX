import { ArrowRight, CircleCheck, CircleX, LayoutDashboard, MessageSquare, RotateCcw, Star } from "lucide-react";
import { api } from "../api/client";
import { DemoBadge, ErrorBox, Loading, ProgressBar, formatDate, levelClass } from "../components/States";
import { navigate, useLoad } from "../hooks";

export default function ResultPage({ id }: { id: string }) {
  const { data: r, error, loading, reload } = useLoad(() => api.attempt(id), [id]);

  if (loading) return <Loading label="Loading your results…" />;
  if (error || !r)
    return (
      <div className="page">
        <ErrorBox message={error ?? "Result not found"} onRetry={reload} />
        <a href="#/results">Back to my results</a>
      </div>
    );

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>Your results {r.is_mock && <DemoBadge label="Mock Evaluation" />}</h1>
          <p className="muted">{r.subject_title} · {formatDate(r.created_at)} · Saved to your history</p>
        </div>
      </header>

      <section className="card score-card">
        <div className="score-ring" style={{ ["--pct" as string]: r.percentage }}>
          <span className="score-num">{r.score}<small>/{r.total}</small></span>
        </div>
        <div className="score-body">
          <span className={levelClass(r.proficiency_level)}>{r.proficiency_level}</span>
          <p className="score-pct">{r.percentage}%</p>
          <ProgressBar value={r.percentage} label="Score percentage" />
          <p>{r.summary_feedback}</p>
          <p className="muted small">Levels: 0–2 correct = Beginner · 3–4 = Intermediate · 5 = Advanced. Evaluated by {r.provider}.</p>
        </div>
      </section>

      <section className="card">
        <h2>Recommended next topics</h2>
        <ul className="topics">
          {r.recommended_topics.map((t) => (
            <li key={t}><Star size={15} aria-hidden /> {t}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Question-by-question feedback</h2>
        {r.breakdown.map((b, i) => (
          <article key={b.question_id} className={`card feedback ${b.is_correct ? "ok" : "bad"}`}>
            <div className="row-between">
              <strong>
                {b.is_correct ? <CircleCheck size={18} className="ok-icon" aria-hidden /> : <CircleX size={18} className="bad-icon" aria-hidden />}{" "}
                Q{i + 1} · {b.is_correct ? "Correct" : "Incorrect"}
              </strong>
              <span className="badge">{b.topic}</span>
            </div>
            <pre className="question-text">{b.question_text}</pre>
            <p>
              Your answer: <strong>{b.selected_option}</strong>
              {!b.is_correct && <> · Correct answer: <strong>{b.correct_option}</strong></>}
            </p>
            <p className="explain">{b.explanation}</p>
          </article>
        ))}
      </section>

      <div className="actions">
        <button className="btn btn-primary" onClick={() => navigate("dashboard")}>
          <LayoutDashboard size={15} aria-hidden /> Go to dashboard <ArrowRight size={15} aria-hidden />
        </button>
        <button className="btn btn-ghost" onClick={() => navigate("chat")}>
          <MessageSquare size={15} aria-hidden /> Study weak topics
        </button>
        <button className="btn btn-ghost" onClick={() => navigate("assessment")}>
          <RotateCcw size={15} aria-hidden /> Retake
        </button>
      </div>
    </div>
  );
}
