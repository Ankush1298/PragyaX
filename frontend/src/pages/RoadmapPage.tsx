import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Compass,
  FileCode2,
  HelpCircle,
  Lock,
  MessageSquare,
  RotateCcw,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading, levelClass } from "../components/States";
import { navigate, useLoad } from "../hooks";

interface TopicUnit {
  id: string;
  unitTitle: string;
  topics: string[];
}

export default function RoadmapPage() {
  const { data: dash, error: dashErr, loading: dashLoading, reload: reloadDash } = useLoad(api.dashboard);
  const { loading: subLoading } = useLoad(api.subjects);
  const [customUnits, setCustomUnits] = useState<TopicUnit[] | null>(null);

  useEffect(() => {
    if (dash?.selected_subject?.id) {
      const stored = localStorage.getItem(`pragyax_roadmap_${dash.selected_subject.id}`);
      if (stored) {
        try {
          setCustomUnits(JSON.parse(stored));
        } catch {
          setCustomUnits(null);
        }
      }
    }
  }, [dash?.selected_subject?.id]);

  if (dashLoading || subLoading) return <Loading label="Synthesizing personalized roadmap…" />;
  if (dashErr || !dash) return <ErrorBox message={dashErr ?? "Dashboard data unavailable"} onRetry={reloadDash} />;

  const { user, selected_subject: subject, metrics: m, recent_attempts, badges } = dash;
  const latestAttempt = recent_attempts[0];
  const hasAssessment = m.total_assessments_completed > 0;

  // Build units list based on custom syllabus extraction if available, else subject syllabus
  const displayUnits: TopicUnit[] = customUnits ?? [
    {
      id: "u1",
      unitTitle: "Unit 1: Fundamental Conceptual Foundations",
      topics: [
        `${subject.title} Core Syntax & Semantics`,
        "Basic Execution Mechanics & State",
        "Elementary Data Structures & Types",
      ],
    },
    {
      id: "u2",
      unitTitle: "Unit 2: Intermediate Diagnostic Principles",
      topics: [
        "Memory Model, References & Mutability",
        "Scoping Protocols & Boundary Behavior",
        "Algorithmic Problem Decomposition",
      ],
    },
    {
      id: "u3",
      unitTitle: "Unit 3: Applied Practical Mastery",
      topics: [
        "Server-Evaluated Code Challenges",
        "Optimization, Complexity & Refactoring",
        "Comprehensive Milestone Capstone",
      ],
    },
  ];

  const missedTopics = latestAttempt && latestAttempt.percentage < 100
    ? dash.recommended_next_topics
    : [];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <Compass size={14} aria-hidden />
            <span>Active Track: {subject.title}</span>
          </div>
          <h1>Personalized Learning Roadmap</h1>
          <p className="muted">
            Adaptive progression path tailored to your diagnostic scores, verified strengths, and
            targeted recovery topics.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate("syllabus")}>
            Customize Syllabus
          </button>
          <button className="btn btn-primary" onClick={() => navigate("assessment")}>
            <RotateCcw size={15} /> {hasAssessment ? "Retake Diagnostic" : "Start Diagnostic"}
          </button>
        </div>
      </header>

      {/* Persistence Architecture Badge */}
      <div className="system-status-indicator" style={{ marginBottom: 20 }}>
        <span className="status-dot-active" />
        <span>
          Roadmap State: <strong>Database-Backed SQLite Store</strong> · Persistent Session ID:{" "}
          <code>{user.id}</code>
        </span>
      </div>

      {/* Skill Analysis & Recovery Summary */}
      <section className="stats" style={{ marginBottom: 24 }}>
        <div className="stat card">
          <Target className="stat-icon" aria-hidden />
          <span className="stat-label">Current Mastery</span>
          <span className="stat-value">
            {latestAttempt ? `${latestAttempt.percentage}%` : "Unassessed"}
          </span>
          <span className={latestAttempt ? levelClass(latestAttempt.proficiency_level) : "muted small"}>
            {latestAttempt ? latestAttempt.proficiency_level : "Take diagnostic to establish baseline"}
          </span>
        </div>

        <div className="stat card">
          <CheckCircle2 className="stat-icon" aria-hidden />
          <span className="stat-label">Completed Assessments</span>
          <span className="stat-value">{m.total_assessments_completed}</span>
          <span className="muted small">Best: {m.best_percentage}% · Avg: {m.average_percentage}%</span>
        </div>

        <div className="stat card">
          <Zap className="stat-icon" aria-hidden />
          <span className="stat-label">Earned XP</span>
          <span className="stat-value">{m.total_points}</span>
          <span className="muted small">Rank: Level {Math.floor(m.total_points / 50) + 1} Scholar</span>
        </div>

        <div className="stat card">
          <Award className="stat-icon" aria-hidden />
          <span className="stat-label">Verified Badges</span>
          <span className="stat-value">{badges.length}</span>
          <span className="muted small">{badges.length > 0 ? badges[0].title : "Complete challenges to unlock"}</span>
        </div>
      </section>

      {/* Recovery Panel if Missed Topics Exist */}
      {missedTopics.length > 0 && (
        <div className="alert alert-warn" style={{ marginBottom: 24 }}>
          <HelpCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong>Targeted Recovery Identified from Latest Assessment</strong>
            <p style={{ margin: "4px 0 10px 0" }}>
              The server detected knowledge gaps in the following areas. Complete focused chat exercises
              to close these gaps before retaking:
            </p>
            <div className="chips" style={{ marginBottom: 12 }}>
              {missedTopics.map((t) => (
                <span key={t} className="chip" style={{ background: "var(--color-warning-soft)", borderColor: "var(--color-warning-border)" }}>
                  <Star size={12} /> {t}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("chat")}>
                <MessageSquare size={14} /> Practice Weak Topics with AI Tutor
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("practice")}>
                <FileCode2 size={14} /> Sandbox Practice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Vertical Timeline Roadmap */}
      <div className="grid-2">
        <section className="card">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <h2>Milestone Progression</h2>
            <span className="badge">
              {hasAssessment ? "Diagnostic Verified" : "Initial Curriculum"}
            </span>
          </div>

          <div className="roadmap-timeline">
            {displayUnits.map((unit, uIdx) => (
              <div key={unit.id} className="timeline-unit-block">
                <div className="timeline-unit-marker">
                  <span className="unit-number-pill">Unit {uIdx + 1}</span>
                  <div className="timeline-line" />
                </div>

                <div className="timeline-unit-content">
                  <h3 className="timeline-unit-title">{unit.unitTitle}</h3>

                  <ul className="timeline-topics-list">
                    {unit.topics.map((topic, tIdx) => {
                      const isCompleted = hasAssessment && (uIdx === 0 || (uIdx === 1 && tIdx === 0 && latestAttempt?.percentage >= 60));
                      const isCurrent = !isCompleted && uIdx === 0;
                      const isLocked = uIdx > 1 && !hasAssessment;

                      return (
                        <li
                          key={tIdx}
                          className={`timeline-topic-item ${isCompleted ? "completed" : isCurrent ? "current" : isLocked ? "locked" : ""}`}
                        >
                          <div className="topic-status-icon">
                            {isCompleted ? (
                              <CheckCircle2 size={16} className="ok-icon" />
                            ) : isCurrent ? (
                              <Circle size={16} className="accent-icon" />
                            ) : (
                              <Lock size={14} className="muted" />
                            )}
                          </div>

                          <div className="topic-text-box">
                            <strong>{topic}</strong>
                            <span className="small muted">
                              {isCompleted
                                ? "Mastered · Verified by diagnostic evaluation"
                                : isCurrent
                                ? "In Progress · Recommended next study objective"
                                : isLocked
                                ? "Prerequisite required: Score ≥ 60% on Unit 1"
                                : "Upcoming core milestone"}
                            </span>
                          </div>

                          <div className="topic-actions">
                            <button
                              type="button"
                              className="btn-link small"
                              onClick={() => navigate("chat")}
                              title="Study concept in learning chat"
                            >
                              Study →
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Learning Cycle & Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="card">
            <h2>The PragyaX Study Loop</h2>
            <p className="muted small">
              How to turn this roadmap into verified practical competence:
            </p>

            <ol className="checklist">
              <li className="done">
                <span className="check">✓</span>
                <div>
                  <strong>01 / Read & Review Structured Notes</strong>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>
                    Understand execution semantics and formulas in structured lessons.
                  </p>
                </div>
              </li>
              <li className="done">
                <span className="check">✓</span>
                <div>
                  <strong>02 / Active Practice with AI Tutor</strong>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>
                    Chat interactively, test edge cases, and solve Daily Code Breakers.
                  </p>
                </div>
              </li>
              <li className={hasAssessment ? "done" : ""}>
                <span className="check">{hasAssessment ? "✓" : ""}</span>
                <div>
                  <strong>03 / Prove with Objective Assessment</strong>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>
                    Take the 5-question test graded server-side against ground-truth keys.
                  </p>
                </div>
              </li>
              <li className={badges.length > 0 ? "done" : ""}>
                <span className="check">{badges.length > 0 ? "✓" : ""}</span>
                <div>
                  <strong>04 / Unlock Digital Credentials & Certs</strong>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>
                    Earn achievement badges and share verified certificates of proficiency.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section className="card">
            <h2>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("lessons")}
              >
                <BookOpen size={16} /> Open Structured Lessons
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("practice")}
              >
                <FileCode2 size={16} /> Open Code Sandbox & Question Bank
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("battles")}
              >
                <Zap size={16} /> Challenge a Peer in 1v1 Battle
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
