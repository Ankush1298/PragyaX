import {
  ArrowRight,
  Award,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  Code2,
  FileUp,
  Flame,
  MessageSquare,
  Milestone,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { navigate, useLoad } from "../hooks";
import { Empty, ErrorBox, Loading, ProgressBar, formatDate, levelClass } from "../components/States";

export default function DashboardPage() {
  const { data, error, loading, reload } = useLoad(api.dashboard);
  if (loading) return <Loading label="Loading your student dashboard…" />;
  if (error || !data) return <ErrorBox message={error ?? "No data"} onRetry={reload} />;

  const { user, selected_subject: subject, metrics: m } = data;
  const hasAttempts = m.total_assessments_completed > 0;

  // Level & XP math
  const currentLevel = Math.floor(m.total_points / 50) + 1;
  const xpInCurrentLevel = m.total_points % 50;
  const xpToNextLevel = 50 - xpInCurrentLevel;
  const levelTitle =
    currentLevel === 1
      ? "Level 1: Novice Scholar"
      : currentLevel === 2
      ? "Level 2: Apprentice Scholar"
      : currentLevel === 3
      ? "Level 3: Competent Practitioner"
      : "Level 4: Master Problem Solver";

  // Journey checklist
  const journey = [
    { label: "Create PragyaX account", done: true },
    { label: `Choose primary subject track (${subject.title})`, done: data.has_selected_subject, path: "subjects" },
    { label: "Upload syllabus or enter topics", done: hasAttempts || !!localStorage.getItem(`pragyax_roadmap_${subject.id}`), path: "syllabus" },
    { label: "Complete a diagnostic assessment", done: hasAttempts, path: "assessment" },
    { label: "Consult AI tutor on weak concepts", done: m.chat_questions_asked > 0, path: "chat" },
    { label: "Solve today's coding challenge", done: m.challenges_attempted > 0, path: "challenge" },
  ];
  const journeyPct = Math.round((journey.filter((j) => j.done).length / journey.length) * 100);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <BookOpen size={13} aria-hidden />
            <span>Active Curriculum Track: {subject.title}</span>
          </div>
          <h1>Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="muted">
            {user.email} · Learning <strong>{subject.title}</strong> · {levelTitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate("syllabus")}>
            <FileUp size={15} /> Upload Syllabus / Topics
          </button>
          <button className="btn btn-primary" onClick={() => navigate("assessment")}>
            <ClipboardCheck size={16} aria-hidden /> {hasAttempts ? "Retake Assessment" : "Take Assessment"}
          </button>
        </div>
      </header>

      {/* Today's Mission & Gamification Banner */}
      <div className="mission-banner card" style={{ marginBottom: 24, borderLeft: "4px solid var(--color-brand-primary)" }}>
        <div className="row-between">
          <div>
            <span className="badge badge-accent" style={{ marginBottom: 6 }}>TODAY'S MISSION</span>
            <h2 style={{ fontSize: "1.15rem", margin: "4px 0" }}>
              Complete the {subject.title} Diagnostic Evaluation & Verify 1 Topic
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              Pass your diagnostic with ≥ 60% to unlock your Verified Proficiency Certificate.
            </p>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <span className="small muted">Level Progress ({xpInCurrentLevel}/50 XP)</span>
              <div style={{ width: 140, marginTop: 4 }}>
                <ProgressBar value={(xpInCurrentLevel / 50) * 100} label="XP Progress" />
              </div>
              <span className="small muted">{xpToNextLevel} XP to Level {currentLevel + 1}</span>
            </div>

            <div className="streak-badge-pill">
              <Flame size={20} className="accent-icon" />
              <div>
                <strong>3 Days</strong>
                <span className="small muted" style={{ display: "block" }}>Streak Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Performance Stats */}
      <section className="stats" style={{ marginBottom: 24 }}>
        <div className="stat card">
          <Target className="stat-icon" aria-hidden />
          <span className="stat-label">Latest Score</span>
          <span className="stat-value">{m.latest_score === null ? "—" : `${m.latest_score}/${m.latest_total}`}</span>
          <span className={m.latest_score === null ? "muted small" : levelClass(m.latest_proficiency)}>
            {m.latest_proficiency}
          </span>
        </div>

        <div className="stat card">
          <ClipboardCheck className="stat-icon" aria-hidden />
          <span className="stat-label">Assessments Completed</span>
          <span className="stat-value">{m.total_assessments_completed}</span>
          <span className="muted small">Best: {m.best_percentage}% · Avg: {m.average_percentage}%</span>
        </div>

        <div className="stat card">
          <MessageSquare className="stat-icon" aria-hidden />
          <span className="stat-label">Questions Asked</span>
          <span className="stat-value">{m.chat_questions_asked}</span>
          <span className="muted small">In Learning Chat</span>
        </div>

        <div className="stat card">
          <Trophy className="stat-icon" aria-hidden />
          <span className="stat-label">Earned Points (XP)</span>
          <span className="stat-value">{m.total_points}</span>
          <span className="muted small">{data.badges.length} Badge{data.badges.length === 1 ? "" : "s"} Unlocked</span>
        </div>
      </section>

      {/* Learning Hub Quick Access Grid */}
      <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>Learning Hub & Active Workflows</h2>
      <div className="learning-hub-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="card hub-card" onClick={() => navigate("syllabus")} style={{ cursor: "pointer" }}>
          <div className="hub-icon-box">
            <FileUp size={20} />
          </div>
          <strong>Syllabus & Topics</strong>
          <span className="muted small">Extract units from PDF or enter topics manually</span>
        </div>

        <div className="card hub-card" onClick={() => navigate("roadmap")} style={{ cursor: "pointer" }}>
          <div className="hub-icon-box">
            <Milestone size={20} />
          </div>
          <strong>Adaptive Roadmap</strong>
          <span className="muted small">Milestones & targeted recovery recommendations</span>
        </div>

        <div className="card hub-card" onClick={() => navigate("lessons")} style={{ cursor: "pointer" }}>
          <div className="hub-icon-box">
            <BookMarked size={20} />
          </div>
          <strong>Structured Lessons</strong>
          <span className="muted small">Theory notes, syntax examples, and quick checks</span>
        </div>

        <div className="card hub-card" onClick={() => navigate("practice")} style={{ cursor: "pointer" }}>
          <div className="hub-icon-box">
            <Code2 size={20} />
          </div>
          <strong>Code Sandbox</strong>
          <span className="muted small">Live Python execution & multi-subject question bank</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Left: Journey Checklist */}
        <section className="card">
          <h2>Learning Progress & Checklist</h2>
          <p className="muted small">Your overall onboarding journey: {journeyPct}% complete</p>
          <ProgressBar value={journeyPct} label="Learning journey progress" />

          <ul className="checklist" style={{ marginTop: 16 }}>
            {journey.map((j) => (
              <li key={j.label} className={j.done ? "done" : ""}>
                <span className="check" aria-hidden>{j.done ? "✓" : ""}</span>
                {j.path && !j.done ? <a href={`#/${j.path}`}>{j.label}</a> : j.label}
              </li>
            ))}
          </ul>

          <div className="mastery" style={{ marginTop: 20 }}>
            <span className="muted small">Best Assessment Mastery: {m.best_percentage}%</span>
            <ProgressBar value={m.best_percentage} label="Best assessment score" />
          </div>
        </section>

        {/* Right: Recommended Topics */}
        <section className="card">
          <h2>Recommended Next Topics</h2>
          <p className="muted small">
            {data.recommendations_source === "latest_assessment"
              ? "Formulated specifically from the concepts you missed in your latest evaluation."
              : `Foundational concepts for ${subject.title}. Take the assessment for personalized recovery.`}
          </p>
          <ul className="topics">
            {data.recommended_next_topics.map((t) => (
              <li key={t}>
                <Star size={15} aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate("chat")}>
              Study in AI Chat <ArrowRight size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("roadmap")}>
              View Full Roadmap
            </button>
          </div>
        </section>
      </div>

      {/* Recent Assessments Table */}
      <section className="card" style={{ marginTop: 24 }}>
        <div className="row-between">
          <h2>Recent Assessment Evaluations</h2>
          {hasAttempts && <a href="#/results">View all history →</a>}
        </div>
        {!hasAttempts ? (
          <Empty title="No assessments completed yet">
            <p className="muted" style={{ marginBottom: 16 }}>
              Complete the 5-question {subject.title} diagnostic assessment to see your verified score history and topic breakdown.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("assessment")}>
              Take Your First Assessment
            </button>
          </Empty>
        ) : (
          <table className="table" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject Track</th>
                <th>Score</th>
                <th>Proficiency Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_attempts.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.created_at)}</td>
                  <td>
                    <strong>{a.subject_title}</strong>
                  </td>
                  <td>
                    <strong>{a.score}/{a.total}</strong>{" "}
                    <span className="muted">({a.percentage}%)</span>
                  </td>
                  <td>
                    <span className={levelClass(a.proficiency_level)}>{a.proficiency_level}</span>
                  </td>
                  <td>
                    <a href={`#/result/${a.id}`} className="btn-link">
                      Review Breakdown →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Earned Badges */}
      {data.badges.length > 0 && (
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Unlocked Digital Credentials</h2>
          <div className="badges" style={{ marginTop: 12 }}>
            {data.badges.map((b) => (
              <div key={b.id} className="badge-card">
                {b.icon === "zap" ? <Zap aria-hidden /> : b.icon === "award" ? <Award aria-hidden /> : <Trophy aria-hidden />}
                <div>
                  <strong>{b.title}</strong>
                  <small className="muted">{b.description}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
