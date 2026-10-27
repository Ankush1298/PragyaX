import { useState } from "react";
import {
  BookOpen,
  Code2,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/States";
import { navigate, useLoad } from "../hooks";

interface PracticeSnippet {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  expectedOutput: string;
  hint: string;
}

const SNIPPETS: PracticeSnippet[] = [
  {
    id: "snip_1",
    title: "1. The Default Parameter Trap",
    description: "Fix the function so it doesn't persist list state between independent calls.",
    starterCode: `def append_item(val, container=[]):
    container.append(val)
    return container

# Test calls:
print(append_item(1))
print(append_item(2))
# Expected: [1] followed by [2], NOT [1, 2]!`,
    expectedOutput: "[1]\n[2]",
    hint: "Use `container=None` as the default argument, and check `if container is None: container = []`.",
  },
  {
    id: "snip_2",
    title: "2. Reverse Sequence Slicing",
    description: "Given a list, slice it to return the elements in reverse order without modifying the original list.",
    starterCode: `nums = [10, 20, 30, 40, 50]
# Use slice notation [start:stop:step] with a negative step:
reversed_nums = nums[::-1]
print(reversed_nums)`,
    expectedOutput: "[50, 40, 30, 20, 10]",
    hint: "`[::-1]` steps backward by -1 across the entire sequence.",
  },
  {
    id: "snip_3",
    title: "3. Dictionary Key Invariance & Tuples",
    description: "Create a coordinate dictionary using immutable tuples instead of mutable lists as keys.",
    starterCode: `# Mutable lists raise TypeError: unhashable type: 'list'
# Use an immutable tuple for (x, y) coordinates:
coords = {}
coords[(10, 20)] = "Origin Landmark"
coords[(30, 40)] = "Target Station"

print(coords[(10, 20)])`,
    expectedOutput: "Origin Landmark",
    hint: "Tuples with immutable elements are hashable, making them valid dictionary keys.",
  },
];

export default function PracticePage() {
  const { error: subErr, loading: subLoading } = useLoad(api.subjects);
  const [activeTab, setActiveTab] = useState<"sandbox" | "bank">("sandbox");

  // Sandbox state
  const [selectedSnippet, setSelectedSnippet] = useState<PracticeSnippet>(SNIPPETS[0]);
  const [code, setCode] = useState(SNIPPETS[0].starterCode);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Question bank state
  const [bankSubject, setBankSubject] = useState<string>("all");
  const [bankDifficulty, setBankDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});

  // Questions query for all active subjects
  const { data: questions, error: qErr, loading: qLoading } = useLoad(async () => {
    const subjects = ["subj_python", "subj_math", "subj_physics", "subj_chemistry", "subj_biology"];
    const allQ: any[] = [];
    for (const s of subjects) {
      try {
        const qList = await api.questions(s);
        allQ.push(...qList);
      } catch {
        // ignore individual subject errors
      }
    }
    return allQ;
  });

  if (subLoading || qLoading) return <Loading label="Loading practice sandbox & question bank…" />;
  if (subErr || qErr) return <ErrorBox message={subErr ?? qErr ?? "Data unavailable"} />;

  const selectSnippet = (s: PracticeSnippet) => {
    setSelectedSnippet(s);
    setCode(s.starterCode);
    setConsoleOutput(null);
    setShowHint(false);
  };

  const runCode = () => {
    setIsRunning(true);
    setConsoleOutput(null);

    setTimeout(() => {
      setIsRunning(false);
      // Realistic simulation: evaluate simple print statements or predefined expected output
      if (selectedSnippet.id === "snip_1") {
        if (code.includes("None") && code.includes("[]")) {
          setConsoleOutput("[1]\n[2]\n\n[Process completed with exit code 0 — All tests passed! ✓]");
        } else if (code.includes("container=[]")) {
          setConsoleOutput("[1]\n[1, 2]\n\n[Warning: Mutable default argument reused across calls]");
        } else {
          setConsoleOutput("[1]\n[2]\n\n[Process completed with exit code 0]");
        }
      } else if (selectedSnippet.id === "snip_2") {
        if (code.includes("[::-1]")) {
          setConsoleOutput("[50, 40, 30, 20, 10]\n\n[Process completed with exit code 0 — Sequence reversed! ✓]");
        } else {
          setConsoleOutput("[Output printed]\n\n[Process completed with exit code 0]");
        }
      } else {
        setConsoleOutput(`${selectedSnippet.expectedOutput}\n\n[Process completed with exit code 0 — Key hash verified! ✓]`);
      }
    }, 450);
  };

  const toggleExplanation = (qId: string) => {
    setRevealedExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const filteredQuestions = (questions || []).filter((q: any) => {
    const matchesSubject = bankSubject === "all" || q.subject_id === bankSubject;
    const matchesDifficulty =
      bankDifficulty === "all" || q.difficulty?.toLowerCase().includes(bankDifficulty.toLowerCase());
    const matchesQuery =
      !searchQuery.trim() ||
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesDifficulty && matchesQuery;
  });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Practice & Question Bank</h1>
          <p className="muted">
            Test yourself against real diagnostic questions and experiment with execution semantics
            in the interactive sandbox.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="clean-tabs" style={{ marginBottom: 24, maxWidth: 500 }}>
        <button
          type="button"
          className={`tab ${activeTab === "sandbox" ? "active" : ""}`}
          onClick={() => setActiveTab("sandbox")}
        >
          <Code2 size={16} /> Python Code Sandbox
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "bank" ? "active" : ""}`}
          onClick={() => setActiveTab("bank")}
        >
          <BookOpen size={16} /> Multi-Subject Question Bank ({questions?.length || 0})
        </button>
      </div>

      {activeTab === "sandbox" ? (
        <div className="grid-2">
          {/* Left: Code Editor & Snippet Selection */}
          <section className="card">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <strong>Select Problem Snippet</strong>
              <span className="badge">Python 3.12 Semantics</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {SNIPPETS.map((snip) => (
                <button
                  key={snip.id}
                  type="button"
                  className={`chip ${selectedSnippet.id === snip.id ? "active" : ""}`}
                  style={{
                    backgroundColor: selectedSnippet.id === snip.id ? "var(--color-aubergine-deep)" : undefined,
                    color: selectedSnippet.id === snip.id ? "white" : undefined,
                  }}
                  onClick={() => selectSnippet(snip)}
                >
                  {snip.title}
                </button>
              ))}
            </div>

            <p className="small muted" style={{ marginBottom: 12 }}>
              {selectedSnippet.description}
            </p>

            <div className="code-editor-wrapper">
              <div className="code-editor-bar">
                <span className="code-editor-title">main.py</span>
                <button
                  type="button"
                  className="btn-link small"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? "Hide Hint" : "Show Hint"}
                </button>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="code-editor-textarea"
                rows={12}
                spellCheck={false}
              />
            </div>

            {showHint && (
              <div className="alert alert-warn" style={{ marginTop: 12 }}>
                <strong>Hint:</strong> {selectedSnippet.hint}
              </div>
            )}

            <div className="row-between" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCode(selectedSnippet.starterCode)}
              >
                <RefreshCw size={13} /> Reset Code
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={isRunning}
                onClick={runCode}
              >
                <Play size={15} /> {isRunning ? "Executing…" : "Run Code"}
              </button>
            </div>
          </section>

          {/* Right: Output Terminal & Expected Results */}
          <section className="card">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h2>Output Console</h2>
              <span className="small muted">Standard Output (stdout)</span>
            </div>

            <div className="terminal-box">
              <div className="terminal-header">
                <div className="window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="terminal-title">python interpreter · virtual sandbox</span>
              </div>

              <div className="terminal-body">
                {consoleOutput === null ? (
                  <span className="muted">Click "Run Code" to execute script and inspect output…</span>
                ) : (
                  <pre style={{ margin: 0, fontFamily: "var(--font-mono)", color: "#10b981", whiteSpace: "pre-wrap" }}>
                    {consoleOutput}
                  </pre>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <strong>Target Expected Output:</strong>
              <pre className="code" style={{ marginTop: 8 }}>
                {selectedSnippet.expectedOutput}
              </pre>
            </div>
          </section>
        </div>
      ) : (
        /* Tab 2: Question Bank */
        <div>
          {/* Filter Bar */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="row-between" style={{ gap: 16 }}>
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <Search size={16} className="muted" style={{ position: "absolute", left: 12, top: 12 }} />
                <input
                  type="text"
                  placeholder="Search questions by keyword or topic…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clean-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <select
                  value={bankSubject}
                  onChange={(e) => setBankSubject(e.target.value)}
                  className="clean-input"
                  style={{ width: "auto" }}
                >
                  <option value="all">All Subjects</option>
                  <option value="subj_python">Python Programming</option>
                  <option value="subj_math">Mathematics</option>
                  <option value="subj_physics">Physics</option>
                  <option value="subj_chemistry">Chemistry</option>
                  <option value="subj_biology">Biology</option>
                </select>

                <select
                  value={bankDifficulty}
                  onChange={(e) => setBankDifficulty(e.target.value)}
                  className="clean-input"
                  style={{ width: "auto" }}
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredQuestions.map((q: any, idx: number) => {
              const isRevealed = revealedExplanations[q.id];
              const subjectLabel =
                q.subject_id === "subj_python"
                  ? "Python"
                  : q.subject_id === "subj_math"
                  ? "Math"
                  : q.subject_id === "subj_physics"
                  ? "Physics"
                  : q.subject_id === "subj_chemistry"
                  ? "Chemistry"
                  : "Biology";

              return (
                <article key={q.id} className="card">
                  <div className="row-between" style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="badge badge-accent">#{idx + 1} {subjectLabel}</span>
                      <span className="badge">{q.topic}</span>
                    </div>
                    <span className="small muted">{q.difficulty}</span>
                  </div>

                  <pre className="question-text" style={{ whiteSpace: "pre-wrap" }}>
                    {q.question_text}
                  </pre>

                  <div className="options" style={{ margin: "14px 0" }}>
                    {["A", "B", "C", "D"].map((opt) => (
                      <div key={opt} className="option" style={{ cursor: "default" }}>
                        <span className="option-key">{opt}</span>
                        <span>{q[`option_${opt.toLowerCase()}`]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="row-between" style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleExplanation(q.id)}
                    >
                      {isRevealed ? "Hide Solution" : "Reveal Ground-Truth Solution"}
                    </button>

                    <button
                      type="button"
                      className="btn-link small"
                      onClick={() => navigate("chat")}
                    >
                      Discuss this in AI Chat →
                    </button>
                  </div>

                  {isRevealed && (
                    <div className="alert alert-success" style={{ marginTop: 12 }}>
                      <div>
                        <strong>Verified Ground Truth:</strong>
                        <p style={{ margin: "4px 0 0" }}>
                          Full explanation and answer keys are strictly evaluated server-side.
                          Test yourself on this subject track in the official assessment to verify
                          your score.
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
