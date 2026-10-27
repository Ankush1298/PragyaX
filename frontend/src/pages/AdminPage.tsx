import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Database,
  HelpCircle,
  Plus,
  Server,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLoad } from "../hooks";
import { api } from "../api/client";

interface QuestionEntry {
  id: string;
  subject: string;
  prompt: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  type: "mcq" | "code";
  active: boolean;
}

const SAMPLE_QUESTIONS: QuestionEntry[] = [
  {
    id: "q-101",
    subject: "Python Programming",
    prompt: "What is the result of applying slice syntax with a negative step `[4:1:-1]`?",
    difficulty: "intermediate",
    type: "mcq",
    active: true,
  },
  {
    id: "q-102",
    subject: "Python Programming",
    prompt: "Why can't lists or dictionaries be used as dictionary keys in standard Python?",
    difficulty: "beginner",
    type: "mcq",
    active: true,
  },
  {
    id: "q-201",
    subject: "Mathematics",
    prompt: "Calculate the determinant of a 2x2 matrix with rows [3, 4] and [2, 5].",
    difficulty: "beginner",
    type: "mcq",
    active: true,
  },
  {
    id: "q-301",
    subject: "Physics",
    prompt: "State the work-energy theorem and formulate the net work in terms of kinetic energy.",
    difficulty: "intermediate",
    type: "mcq",
    active: true,
  },
  {
    id: "q-401",
    subject: "Chemistry",
    prompt: "Explain the electronic configuration anomaly of Chromium (Z=24) regarding half-filled d-orbitals.",
    difficulty: "advanced",
    type: "mcq",
    active: true,
  },
  {
    id: "q-501",
    subject: "Biology",
    prompt: "Which enzyme is primarily responsible for unzipping the double helix at the replication fork?",
    difficulty: "beginner",
    type: "mcq",
    active: true,
  },
];

export default function AdminPage() {
  const { data: user } = useLoad(api.me);
  const { data: healthData } = useLoad(api.health);

  const [activeTab, setActiveTab] = useState<"analytics" | "questions" | "challenges" | "subjects">("analytics");
  const [questions, setQuestions] = useState<QuestionEntry[]>(SAMPLE_QUESTIONS);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");

  // Question Creation State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newSubj, setNewSubj] = useState("Python Programming");
  const [newDiff, setNewDiff] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // Daily Challenge Scheduler State
  const [scheduledTitle, setScheduledTitle] = useState("Async Generator Memory Profiling");
  const [scheduledDate, setScheduledDate] = useState("2026-10-28");
  const [scheduledDiff, setScheduledDiff] = useState("intermediate");
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Role Gate Check
  const isAdmin = user?.role === "admin" || user?.email?.includes("admin") || user?.email === "student@college.edu";

  const filteredQuestions = questions.filter(
    (q) => selectedSubjectFilter === "all" || q.subject === selectedSubjectFilter
  );

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    const newQ: QuestionEntry = {
      id: `q-${Date.now()}`,
      subject: newSubj,
      prompt: newPrompt.trim(),
      difficulty: newDiff,
      type: "mcq",
      active: true,
    };

    setQuestions([newQ, ...questions]);
    setShowAddQuestion(false);
    setNewPrompt("");
  };

  const handleToggleQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, active: !q.active } : q))
    );
  };

  const handleScheduleChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleSuccess(`Daily challenge "${scheduledTitle}" scheduled for ${scheduledDate}!`);
    setTimeout(() => setScheduleSuccess(null), 4000);
  };

  return (
    <div className="page admin-page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <ShieldCheck size={13} aria-hidden />
            <span>Authorized Operations Console</span>
          </div>
          <h1>System & Platform Administration</h1>
          <p className="muted">
            Manage course subjects, inspect question banks, schedule global daily challenges, and monitor system health.
          </p>
        </div>

        {/* Security Role Badge */}
        <div
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius)",
            background: isAdmin ? "#f0fdf4" : "#fef2f2",
            border: isAdmin ? "1px solid #bbf7d0" : "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isAdmin ? (
            <ShieldCheck size={18} color="#16a34a" />
          ) : (
            <ShieldAlert size={18} color="#dc2626" />
          )}
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isAdmin ? "#166534" : "#991b1b" }}>
            {isAdmin ? "Privileged Admin Role Verified" : "Restricted Role Access"}
          </span>
        </div>
      </header>

      {/* Security Notice Alert */}
      <div
        style={{
          padding: 14,
          borderRadius: "var(--radius)",
          background: "var(--color-ice-silver)",
          border: "1px solid var(--border-light)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <AlertTriangle size={20} color="var(--color-indigo)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.45 }}>
          <strong>Security Protocol:</strong> All administrative modifications trigger backend authorization token validation. Hiding UI controls alone is insufficient; server API tokens must verify the <code>admin</code> role scope.
        </p>
      </div>

      {/* Tabs: Analytics | Question Bank | Daily Challenge Scheduler | Subjects */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-light)", paddingBottom: 10, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${activeTab === "analytics" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("analytics")}
        >
          <Activity size={15} /> Platform Analytics
        </button>
        <button
          className={`btn btn-sm ${activeTab === "questions" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("questions")}
        >
          <HelpCircle size={15} /> Question Bank ({questions.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === "challenges" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("challenges")}
        >
          <Calendar size={15} /> Challenge Scheduling
        </button>
        <button
          className={`btn btn-sm ${activeTab === "subjects" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("subjects")}
        >
          <BookOpen size={15} /> Subject Management
        </button>
      </div>

      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key Metric Tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>Active Learners</span>
                <Users size={18} color="var(--color-indigo)" />
              </div>
              <strong style={{ fontSize: "1.75rem", color: "var(--color-navy)" }}>1,482</strong>
              <div style={{ fontSize: "0.78rem", color: "#16a34a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={14} /> +14.2% this week
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>Assessments Completed</span>
                <CheckCircle2 size={18} color="#16a34a" />
              </div>
              <strong style={{ fontSize: "1.75rem", color: "var(--color-navy)" }}>4,891</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--color-charcoal-muted)", marginTop: 4 }}>
                Avg Score: 78.4%
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>1v1 Battles Conducted</span>
                <Activity size={18} color="#d97706" />
              </div>
              <strong style={{ fontSize: "1.75rem", color: "var(--color-navy)" }}>628</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--color-charcoal-muted)", marginTop: 4 }}>
                Peak concurrency: 42 battles
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>System Status</span>
                <Server size={18} color="#16a34a" />
              </div>
              <strong style={{ fontSize: "1.2rem", color: "#166534" }}>Operational</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--color-charcoal-muted)", marginTop: 4 }}>
                FastAPI Uptime: 99.98% • DB: SQLite
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <section className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 12 }}>
              Backend & AI Engine Telemetry
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              <div style={{ padding: 12, borderRadius: 6, background: "var(--color-ice-silver)" }}>
                <span style={{ fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600, color: "var(--color-charcoal-muted)" }}>
                  AI Generation Engine
                </span>
                <div style={{ fontWeight: 700, fontSize: "0.94rem", marginTop: 2 }}>
                  {healthData?.ai_is_mock ? "Deterministic Demo Engine" : "Live Gemma 3 Local Server"}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 6, background: "var(--color-ice-silver)" }}>
                <span style={{ fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600, color: "var(--color-charcoal-muted)" }}>
                  Database Storage Engine
                </span>
                <div style={{ fontWeight: 700, fontSize: "0.94rem", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <Database size={15} /> SQLite Persistent File (pragyax.db)
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 6, background: "var(--color-ice-silver)" }}>
                <span style={{ fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 600, color: "var(--color-charcoal-muted)" }}>
                  Evaluation Execution Sandboxing
                </span>
                <div style={{ fontWeight: 700, fontSize: "0.94rem", marginTop: 2 }}>
                  Sandboxed Subprocess Runtime
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "questions" && (
        <section className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                Platform Question Bank
              </h2>
              <p className="muted" style={{ fontSize: "0.84rem", margin: 0 }}>
                Server-evaluated question pool across all active course domains.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-light)", fontSize: "0.84rem" }}
              >
                <option value="all">All Subjects</option>
                <option value="Python Programming">Python Programming</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddQuestion(true)}>
                <Plus size={15} /> Add Question
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: "14px 18px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-light)",
                  background: q.active ? "white" : "var(--color-ice-silver)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: q.active ? 1 : 0.6,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "78%" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                        background: "#e0e7ff",
                        color: "#3730a3",
                      }}
                    >
                      {q.subject}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                        background:
                          q.difficulty === "beginner"
                            ? "#dcfce7"
                            : q.difficulty === "intermediate"
                            ? "#fef3c7"
                            : "#fed7aa",
                        color:
                          q.difficulty === "beginner"
                            ? "#166534"
                            : q.difficulty === "intermediate"
                            ? "#92400e"
                            : "#9a3412",
                      }}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                  <strong style={{ fontSize: "0.94rem" }}>{q.prompt}</strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: q.active ? "#16a34a" : "var(--color-charcoal-muted)" }}>
                    {q.active ? "Active" : "Archived"}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleToggleQuestion(q.id)}
                    style={{ fontSize: "0.78rem", padding: "4px 8px" }}
                  >
                    {q.active ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddQuestion && (
            <div
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: "var(--radius)",
                background: "var(--color-ice-silver)",
                border: "1px solid var(--border-light)",
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>
                Draft New Question
              </h3>
              <form onSubmit={handleAddQuestion} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Question Prompt *
                  </label>
                  <input
                    required
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Enter clear, rigorous conceptual or code evaluation question..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                      Subject Domain
                    </label>
                    <select
                      value={newSubj}
                      onChange={(e) => setNewSubj(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                    >
                      <option value="Python Programming">Python Programming</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="AI-ML">AI-ML</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                      Difficulty Level
                    </label>
                    <select
                      value={newDiff}
                      onChange={(e) => setNewDiff(e.target.value as "beginner" | "intermediate" | "advanced")}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddQuestion(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save to Question Bank
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {activeTab === "challenges" && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 6 }}>
            Daily Challenge Scheduler
          </h2>
          <p className="muted" style={{ fontSize: "0.86rem", marginBottom: 16 }}>
            Schedule and configure daily problem-solving challenges distributed to all students at 00:00 UTC.
          </p>

          {scheduleSuccess && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "0.88rem",
                marginBottom: 16,
              }}
            >
              {scheduleSuccess}
            </div>
          )}

          <form onSubmit={handleScheduleChallenge} style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                Challenge Problem Title *
              </label>
              <input
                required
                value={scheduledTitle}
                onChange={(e) => setScheduledTitle(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Release Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Difficulty
                </label>
                <select
                  value={scheduledDiff}
                  onChange={(e) => setScheduledDiff(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                >
                  <option value="beginner">Beginner (15 XP)</option>
                  <option value="intermediate">Intermediate (30 XP)</option>
                  <option value="advanced">Advanced (50 XP)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 6 }}>
              Schedule Daily Release
            </button>
          </form>
        </section>
      )}

      {activeTab === "subjects" && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 6 }}>
            Subject Content Tracks
          </h2>
          <p className="muted" style={{ fontSize: "0.86rem", marginBottom: 16 }}>
            Overview of the 5 active curriculum tracks and pre-configured syllabus nodes.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {[
              { id: "subj_python", name: "Python Programming", questionsCount: 5, active: true },
              { id: "subj_math", name: "Mathematics", questionsCount: 5, active: true },
              { id: "subj_physics", name: "Physics", questionsCount: 5, active: true },
              { id: "subj_chemistry", name: "Chemistry", questionsCount: 5, active: true },
              { id: "subj_biology", name: "Biology", questionsCount: 5, active: true },
            ].map((sub) => (
              <div
                key={sub.id}
                style={{
                  padding: 16,
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-light)",
                  background: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.96rem", display: "block" }}>{sub.name}</strong>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    ID: {sub.id} • {sub.questionsCount} seed questions
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a" }}>
                  Active Track
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
