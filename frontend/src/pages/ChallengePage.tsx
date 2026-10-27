import { useState } from "react";
import {
  Award,
  CircleCheck,
  CircleX,
  Code2,
  Crown,
  History,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import type { ChallengeResult, Option } from "../api/types";
import { ErrorBox, Loading } from "../components/States";
import { useLoad } from "../hooks";

const OPTIONS: Option[] = ["A", "B", "C", "D"];

interface PlatformChallenge {
  id: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  points: number;
  participantsCount: number;
  summary: string;
  codeSnippet: string;
  options: { key: Option; text: string }[];
  correctKey: Option;
  explanation: string;
  status: "available" | "completed";
}

const PLATFORM_CHALLENGES: PlatformChallenge[] = [
  {
    id: "pc-1",
    title: "Python Default Parameter Pointer Trap",
    subject: "Python Programming",
    difficulty: "medium",
    points: 40,
    participantsCount: 312,
    summary: "Analyze the behavior of mutable default arguments across consecutive function invocations.",
    codeSnippet: `def collect(x, bucket=[]):\n    bucket.append(x)\n    return bucket\n\ncollect(1)\nprint(collect(2))`,
    options: [
      { key: "A", text: "[2]" },
      { key: "B", text: "[1, 2]" },
      { key: "C", text: "TypeError" },
      { key: "D", text: "[1]" },
    ],
    correctKey: "B",
    explanation: "Default parameters in Python are evaluated once at function definition time, binding a single persistent list object.",
    status: "available",
  },
  {
    id: "pc-2",
    title: "Logarithmic Time Complexity Matrix Exponentiation",
    subject: "Mathematics",
    difficulty: "hard",
    points: 75,
    participantsCount: 184,
    summary: "Compute the N-th Fibonacci term in O(log N) operations using 2x2 matrix transformation exponentiation.",
    codeSnippet: `M = [[1, 1], [1, 0]]\n# Compute M^N using binary exponentiation`,
    options: [
      { key: "A", text: "O(N)" },
      { key: "B", text: "O(N log N)" },
      { key: "C", text: "O(log N)" },
      { key: "D", text: "O(1)" },
    ],
    correctKey: "C",
    explanation: "Binary matrix exponentiation squares the transformation matrix at each step, halving the power in O(log N) iterations.",
    status: "available",
  },
  {
    id: "pc-3",
    title: "Quantum Spin State Superposition & Decoherence",
    subject: "Physics",
    difficulty: "extreme",
    points: 100,
    participantsCount: 96,
    summary: "Evaluate the probability amplitude collapse of a Hadamard-transformed spin qubit under projective measurement.",
    codeSnippet: `|ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩\nMeasure in standard Z-basis`,
    options: [
      { key: "A", text: "100% |0⟩" },
      { key: "B", text: "50% |0⟩ and 50% |1⟩" },
      { key: "C", text: "Deterministic |1⟩" },
      { key: "D", text: "Undetermined" },
    ],
    correctKey: "B",
    explanation: "The Born rule states probability equals the squared modulus of the amplitude: |1/√2|² = 1/2 = 50%.",
    status: "available",
  },
];

export default function ChallengePage() {
  const { data: c, error, loading, reload } = useLoad(api.dailyChallenge);

  // Daily Challenge State
  const [choice, setChoice] = useState<Option | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Platform Challenges Discovery State
  const [activeTab, setActiveTab] = useState<"daily" | "platform" | "rankings" | "history">("daily");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState<PlatformChallenge | null>(PLATFORM_CHALLENGES[0]);

  // Selected Platform Challenge Interactive State
  const [platChoice, setPlatChoice] = useState<Option | null>(null);
  const [platSubmitted, setPlatSubmitted] = useState(false);

  if (loading) return <Loading label="Loading today's challenge…" />;
  if (error || !c) return <ErrorBox message={error ?? "No challenge"} onRetry={reload} />;

  const submit = async () => {
    if (!choice) return;
    setBusy(true);
    setSubmitError(null);
    try {
      setResult(await api.submitChallenge(c.id, choice));
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const done =
    result ??
    (c.has_completed && c.user_submission
      ? {
          is_correct: !!c.user_submission.is_correct,
          points_awarded: c.user_submission.points_awarded,
          correct_option: c.correct_option ?? "",
          explanation: c.explanation ?? "",
        }
      : null);
  const picked = result ? choice : (c.user_submission?.submitted_answer as Option | undefined) ?? choice;

  const filteredPlatformChallenges = PLATFORM_CHALLENGES.filter((pc) => {
    const matchSubj = subjectFilter === "all" || pc.subject === subjectFilter;
    const matchDiff = difficultyFilter === "all" || pc.difficulty === difficultyFilter;
    return matchSubj && matchDiff;
  });

  return (
    <div className="page challenge-page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <Zap size={13} aria-hidden />
            <span>Competitive Challenge Hub</span>
          </div>
          <h1>Challenges & Global Code Breaker</h1>
          <p className="muted">
            Daily bite-sized algorithmic puzzles, platform-wide multi-subject challenges, and real-time rankings.
          </p>
        </div>

        {/* Winner Announcement Banner */}
        <div
          style={{
            padding: "8px 14px",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Crown size={18} color="#b45309" />
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#92400e" }}>
            Weekly Champion: Priyanshu K. (IIT Bombay) — 450 XP
          </span>
        </div>
      </header>

      {/* Tabs: Daily Challenge | Platform Challenges | Rankings | History */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-light)", paddingBottom: 10, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${activeTab === "daily" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("daily")}
        >
          <Zap size={14} /> Daily Challenge (1 Attempt)
        </button>
        <button
          className={`btn btn-sm ${activeTab === "platform" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("platform")}
        >
          <Code2 size={14} /> Platform Challenges ({PLATFORM_CHALLENGES.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === "rankings" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("rankings")}
        >
          <Trophy size={14} /> Challenge Leaderboard
        </button>
        <button
          className={`btn btn-sm ${activeTab === "history" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={14} /> My History
        </button>
      </div>

      {activeTab === "daily" && (
        <section className="card question" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="row-between">
            <strong style={{ fontSize: "1.1rem" }}>{c.title}</strong>
            <span className="badge badge-accent">
              {c.difficulty} · {c.points} pts
            </span>
          </div>
          <p style={{ marginTop: 8 }}>{c.description}</p>
          <pre className="code">{c.code_snippet}</pre>
          <fieldset className="options" disabled={!!done || busy} style={{ border: "none", padding: 0, margin: "16px 0" }}>
            <legend className="sr-only">Choose one answer</legend>
            {OPTIONS.map((o) => {
              const cls = done
                ? o === done.correct_option
                  ? "correct"
                  : o === picked
                  ? "wrong"
                  : ""
                : choice === o
                ? "chosen"
                : "";
              return (
                <label key={o} className={`option ${cls}`}>
                  <input
                    type="radio"
                    name="challenge"
                    checked={picked === o}
                    onChange={() => setChoice(o)}
                  />
                  <span className="option-key">{o}</span>
                  <code>{c[`option_${o.toLowerCase()}` as "option_a"]}</code>
                </label>
              );
            })}
          </fieldset>
          {submitError && <ErrorBox message={submitError} />}
          {done ? (
            <div className={`alert ${done.is_correct ? "alert-success" : "alert-error"}`} role="status">
              {done.is_correct ? <CircleCheck size={18} aria-hidden /> : <CircleX size={18} aria-hidden />}
              <div>
                <strong>
                  {done.is_correct ? `Correct! +${done.points_awarded} points` : "Not quite. No points this time."}
                </strong>
                {done.is_correct && (
                  <p>
                    <Award size={14} aria-hidden /> Badge: Daily Code Breaker
                  </p>
                )}
                <p>{done.explanation}</p>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block"
              disabled={!choice || busy}
              onClick={submit}
              style={{ marginTop: 8 }}
            >
              {busy ? "Checking…" : "Submit Answer"}
            </button>
          )}
        </section>
      )}

      {activeTab === "platform" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-light)", fontSize: "0.85rem" }}
            >
              <option value="all">All Subjects</option>
              <option value="Python Programming">Python Programming</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-light)", fontSize: "0.85rem" }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20, alignItems: "start" }}>
            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredPlatformChallenges.map((pc) => {
                const isSelected = selectedChallenge?.id === pc.id;
                return (
                  <div
                    key={pc.id}
                    onClick={() => {
                      setSelectedChallenge(pc);
                      setPlatChoice(null);
                      setPlatSubmitted(false);
                    }}
                    className="card"
                    style={{
                      padding: 16,
                      cursor: "pointer",
                      border: isSelected ? "2px solid var(--color-indigo)" : "1px solid var(--border-light)",
                      background: isSelected ? "var(--color-ice-silver)" : "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="badge-pill">{pc.subject}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-indigo)" }}>
                        +{pc.points} XP
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1rem", margin: "0 0 6px 0", fontWeight: 700 }}>{pc.title}</h3>
                    <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 10px 0" }}>
                      {pc.summary}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <span className="muted" style={{ textTransform: "capitalize" }}>
                        Level: {pc.difficulty}
                      </span>
                      <span className="muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={13} /> {pc.participantsCount} Solved
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Challenge Details & Solver */}
            {selectedChallenge && (
              <section className="card" style={{ padding: 20 }}>
                <span className="badge-pill" style={{ marginBottom: 6 }}>
                  {selectedChallenge.subject}
                </span>
                <h2 style={{ fontSize: "1.25rem", margin: "4px 0 8px 0", fontWeight: 700 }}>
                  {selectedChallenge.title}
                </h2>
                <p className="muted" style={{ fontSize: "0.86rem", marginBottom: 14 }}>
                  {selectedChallenge.summary}
                </p>

                <pre className="code" style={{ marginBottom: 16 }}>{selectedChallenge.codeSnippet}</pre>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {selectedChallenge.options.map((opt) => (
                    <label
                      key={opt.key}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 6,
                        border: "1px solid",
                        borderColor:
                          platSubmitted && opt.key === selectedChallenge.correctKey
                            ? "#16a34a"
                            : platSubmitted && platChoice === opt.key
                            ? "#dc2626"
                            : platChoice === opt.key
                            ? "var(--color-indigo)"
                            : "var(--border-light)",
                        background:
                          platSubmitted && opt.key === selectedChallenge.correctKey
                            ? "#f0fdf4"
                            : platSubmitted && platChoice === opt.key
                            ? "#fef2f2"
                            : platChoice === opt.key
                            ? "var(--color-ice-silver)"
                            : "white",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: platSubmitted ? "default" : "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        disabled={platSubmitted}
                        checked={platChoice === opt.key}
                        onChange={() => setPlatChoice(opt.key)}
                      />
                      <strong style={{ fontSize: "0.88rem" }}>{opt.key}</strong>
                      <code style={{ fontSize: "0.86rem" }}>{opt.text}</code>
                    </label>
                  ))}
                </div>

                {platSubmitted ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      background: platChoice === selectedChallenge.correctKey ? "#f0fdf4" : "#fff7ed",
                      border: "1px solid",
                      borderColor: platChoice === selectedChallenge.correctKey ? "#bbf7d0" : "#fed7aa",
                    }}
                  >
                    <strong style={{ color: platChoice === selectedChallenge.correctKey ? "#166534" : "#9a3412" }}>
                      {platChoice === selectedChallenge.correctKey
                        ? `Correct! +${selectedChallenge.points} XP Awarded`
                        : "Incorrect"}
                    </strong>
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.84rem" }}>
                      {selectedChallenge.explanation}
                    </p>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-block"
                    disabled={!platChoice}
                    onClick={() => setPlatSubmitted(true)}
                  >
                    Submit Challenge Answer
                  </button>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {activeTab === "rankings" && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>
            Global Challenge Rankings
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { rank: 1, name: "Priyanshu K.", college: "IIT Bombay", solved: 42, points: "890 XP" },
              { rank: 2, name: "Sneha Reddy", college: "BITS Pilani", solved: 39, points: "810 XP" },
              { rank: 3, name: "Asha Sharma", college: "Delhi University", solved: 36, points: "760 XP" },
              { rank: 4, name: "Rohan Patel", college: "NIT Trichy", solved: 31, points: "640 XP" },
            ].map((r) => (
              <div
                key={r.rank}
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-light)",
                  background: r.rank === 1 ? "#fef3c7" : "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", width: 24 }}>
                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                  </span>
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>{r.name}</strong>
                    <span className="muted" style={{ fontSize: "0.8rem", display: "block" }}>
                      {r.college}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: "var(--color-indigo)", fontSize: "0.95rem" }}>
                    {r.points}
                  </strong>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {r.solved} challenges solved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>
            My Challenge Submission Log
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { id: "h-1", title: "Daily Challenge: Dictionary Immutability", date: "Today", result: "Correct", xp: "+30 XP" },
              { id: "h-2", title: "Python Default Parameter Pointer Trap", date: "Yesterday", result: "Correct", xp: "+40 XP" },
              { id: "h-3", title: "Quantum Spin State Superposition", date: "3 days ago", result: "Incorrect", xp: "0 XP" },
            ].map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.92rem", display: "block" }}>{item.title}</strong>
                  <span className="muted" style={{ fontSize: "0.78rem" }}>{item.date}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: item.result === "Correct" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {item.result} ({item.xp})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
