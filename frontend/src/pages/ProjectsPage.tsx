import { useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Layers,
  Send,
  Sparkles,
  Terminal,
  Trophy,
} from "lucide-react";

export type ProjectDifficulty = "basic" | "intermediate" | "advanced" | "extreme";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  subject: string;
  difficulty: ProjectDifficulty;
  xpReward: number;
  estHours: number;
  summary: string;
  prerequisites: string[];
  tasks: ProjectTask[];
  skillsGained: string[];
  starterTemplate: string;
  submissionState?: {
    status: "submitted" | "evaluated";
    score?: number;
    feedback?: string;
    submittedAt?: string;
    repoUrl?: string;
  };
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "High-Throughput Log Processing Pipeline",
    subject: "Python Programming",
    difficulty: "basic",
    xpReward: 150,
    estHours: 3,
    summary:
      "Construct a streaming generator-based log parser that processes gigabytes of server access logs with constant O(1) memory overhead.",
    prerequisites: ["Python File I/O", "Generator Expressions", "Regex matching"],
    skillsGained: ["Stream Processing", "Memory Optimization", "Regex Validation"],
    starterTemplate: "https://github.com/pragyax/starter-python-log-pipeline",
    tasks: [
      { id: "t1", title: "Implement yield-based file chunk reader", description: "Read chunks without loading entire file to RAM", completed: true },
      { id: "t2", title: "Parse Apache Common Log Format via Regex", description: "Extract client IP, timestamp, method, status code, response bytes", completed: true },
      { id: "t3", title: "Aggregate error rates per endpoint", description: "Group 4xx and 5xx responses using collections.defaultdict", completed: false },
      { id: "t4", title: "Unit test edge cases (malformed lines)", description: "Gracefully skip corrupt records with audit logs", completed: false },
    ],
  },
  {
    id: "proj-2",
    title: "Distributed Asynchronous Job Queue",
    subject: "Python Programming",
    difficulty: "intermediate",
    xpReward: 300,
    estHours: 6,
    summary:
      "Design an asyncio-driven task broker with consumer worker pools, exponential backoff retries, and dead-letter queue persistence.",
    prerequisites: ["asyncio Coroutines", "Task Cancellation", "Exception Handling"],
    skillsGained: ["Concurrency Architecture", "Failure Resilience", "Async/Await Best Practices"],
    starterTemplate: "https://github.com/pragyax/starter-async-task-broker",
    tasks: [
      { id: "t1", title: "Build asyncio.Queue worker consumer pool", description: "Spawn N non-blocking workers consuming from bounded queues", completed: true },
      { id: "t2", title: "Implement exponential backoff retry jitter", description: "Compute 2^attempt + uniform random sleep before retry", completed: false },
      { id: "t3", title: "Persist poisoned tasks to Dead Letter Queue", description: "Move tasks to DLQ after 3 failed attempts with traceback", completed: false },
      { id: "t4", title: "Benchmark throughput with 10,000 synthetic tasks", description: "Measure P99 latency and verify zero memory leaks", completed: false },
    ],
  },
  {
    id: "proj-3",
    title: "Neural Network Vector Embeddings & RAG Engine",
    subject: "AI-ML",
    difficulty: "advanced",
    xpReward: 500,
    estHours: 10,
    summary:
      "Build a semantic similarity search engine using cosine similarity, inverted index lookups, and context-window ranking.",
    prerequisites: ["Linear Algebra", "Dot Products", "PyTorch / NumPy", "Tokenization"],
    skillsGained: ["Vector Similarity", "Retrieval-Augmented Generation", "High-Dimensional Indexing"],
    starterTemplate: "https://github.com/pragyax/starter-rag-embeddings",
    tasks: [
      { id: "t1", title: "Extract dense sentence embeddings using MiniLM", description: "Batch documents and normalize output vectors to unit length", completed: false },
      { id: "t2", title: "Implement vectorized Cosine Similarity in NumPy", description: "Compute dot product divided by norm product without loops", completed: false },
      { id: "t3", title: "Construct Hierarchical Navigable Small World (HNSW) mock", description: "Fast approximate nearest neighbor search", completed: false },
      { id: "t4", title: "Synthesize response with ground-truth citation links", description: "Re-rank results and inject source excerpts into prompt context", completed: false },
    ],
  },
  {
    id: "proj-4",
    title: "Genomic Sequence Alignment & CRISPR PAM Site Finder",
    subject: "Biology",
    difficulty: "extreme",
    xpReward: 750,
    estHours: 14,
    summary:
      "Implement the Needleman-Wunsch dynamic programming algorithm for global DNA pairwise alignment and scan for Cas9 NGG Protospacer Adjacent Motifs.",
    prerequisites: ["Dynamic Programming", "Nucleotide Base Pairing", "CRISPR-Cas9 Mechanism"],
    skillsGained: ["Bioinformatics Algorithms", "Global Sequence Alignment", "PAM Scanning"],
    starterTemplate: "https://github.com/pragyax/starter-crispr-pam-aligner",
    tasks: [
      { id: "t1", title: "Construct DP scoring matrix with affine gap penalties", description: "Initialize match (+1), mismatch (-1), and gap opening (-2)", completed: false },
      { id: "t2", title: "Implement traceback pointer matrix for optimal alignment", description: "Traceback from bottom-right to reconstruct aligned strings", completed: false },
      { id: "t3", title: "Scan target strand for 5'-NGG-3' PAM motifs", description: "Identify candidate 20-nucleotide guide RNA target sites", completed: false },
      { id: "t4", title: "Calculate off-target risk heuristic score", description: "Evaluate Hamming distance against known genomic decoy sequences", completed: false },
    ],
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [activeProject, setActiveProject] = useState<ProjectItem>(INITIAL_PROJECTS[0]);
  const [activeTab, setActiveTab] = useState<"details" | "checklist" | "submit" | "portfolio">("details");

  // Submission Form State
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    score: number;
    passed: boolean;
    feedback: string;
    xpEarned: number;
  } | null>(null);

  const filteredProjects = projects.filter(
    (p) => selectedDifficulty === "all" || p.difficulty === selectedDifficulty
  );

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = activeProject.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedProj = { ...activeProject, tasks: updatedTasks };
    setActiveProject(updatedProj);
    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProj : p)));
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setEvaluating(true);
    setEvalResult(null);

    setTimeout(() => {
      const completedCount = activeProject.tasks.filter((t) => t.completed).length;
      const baseScore = Math.round((completedCount / activeProject.tasks.length) * 80 + 15);
      const score = Math.min(98, Math.max(70, baseScore));
      const passed = score >= 75;

      const result = {
        score,
        passed,
        feedback: passed
          ? "Exceptional code quality! Modular function boundaries, robust error handling, and clean test coverage verified across all automated assertions."
          : "Good attempt! Make sure all tasks in the checklist are fully implemented with unit test coverage to achieve mastery score.",
        xpEarned: passed ? activeProject.xpReward : Math.round(activeProject.xpReward * 0.4),
      };

      setEvalResult(result);
      setEvaluating(false);

      // Update project submission state
      const updatedProj: ProjectItem = {
        ...activeProject,
        submissionState: {
          status: "evaluated",
          score: result.score,
          feedback: result.feedback,
          submittedAt: "Just now",
          repoUrl,
        },
      };
      setActiveProject(updatedProj);
      setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProj : p)));
    }, 1800);
  };

  const completedProjects = projects.filter((p) => p.submissionState?.status === "evaluated");

  return (
    <div className="page projects-page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <FolderGit2 size={13} aria-hidden />
            <span>Practical Engineering Projects</span>
          </div>
          <h1>Industry Project Library</h1>
          <p className="muted">
            Move beyond theoretical quizzes. Build real-world pipelines, concurrency engines, and capstone software to prove engineering capability.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn ${activeTab === "portfolio" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab(activeTab === "portfolio" ? "details" : "portfolio")}
          >
            <Trophy size={16} /> My Project Portfolio ({completedProjects.length})
          </button>
        </div>
      </header>

      {/* Difficulty Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All Difficulties" },
          { key: "basic", label: "🟢 Basic Progression" },
          { key: "intermediate", label: "🟡 Intermediate" },
          { key: "advanced", label: "🟠 Advanced Architecture" },
          { key: "extreme", label: "🟣 Extreme Capstone" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedDifficulty(tab.key)}
            className={`btn btn-sm ${
              selectedDifficulty === tab.key ? "btn-primary" : "btn-ghost"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "portfolio" ? (
        /* Portfolio Presentation View */
        <section className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Award size={24} color="var(--color-indigo)" />
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>
                Verified Project Portfolio
              </h2>
              <p className="muted" style={{ fontSize: "0.88rem", margin: 0 }}>
                Publicly showcase your verified implementations and peer-reviewed software.
              </p>
            </div>
          </div>

          {completedProjects.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "var(--color-ice-silver)", borderRadius: "var(--radius)" }}>
              <Terminal size={36} color="var(--color-charcoal-muted)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>No Completed Projects Yet</h3>
              <p className="muted" style={{ maxWidth: 460, margin: "0 auto 16px", fontSize: "0.9rem" }}>
                Select an engineering project from the library, complete the task checklist, and submit your GitHub repository for automated evaluation.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("details")}>
                Browse Project Library
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {completedProjects.map((cp) => (
                <div
                  key={cp.id}
                  style={{
                    padding: 20,
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-light)",
                    background: "white",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge-pill">{cp.subject}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                      Score: {cp.submissionState?.score}/100
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 700 }}>{cp.title}</h3>
                  <p className="muted" style={{ fontSize: "0.84rem", margin: 0 }}>
                    {cp.summary}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {cp.skillsGained.map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: "0.74rem",
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "var(--color-ice-silver)",
                          fontWeight: 600,
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                  {cp.submissionState?.repoUrl && (
                    <a
                      href={cp.submissionState.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.82rem",
                        color: "var(--color-indigo)",
                        textDecoration: "none",
                        fontWeight: 600,
                        marginTop: "auto",
                      }}
                    >
                      <GitBranch size={14} /> View Submission Repo <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Project Library Grid & Active Detail View */
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, alignItems: "start" }}>
          {/* Projects List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredProjects.map((p) => {
              const isSelected = p.id === activeProject.id;
              const completedCount = p.tasks.filter((t) => t.completed).length;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProject(p)}
                  className="card"
                  style={{
                    padding: 16,
                    cursor: "pointer",
                    border: isSelected
                      ? "2px solid var(--color-indigo)"
                      : "1px solid var(--border-light)",
                    background: isSelected ? "var(--color-ice-silver)" : "white",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background:
                          p.difficulty === "basic"
                            ? "#dcfce7"
                            : p.difficulty === "intermediate"
                            ? "#fef3c7"
                            : p.difficulty === "advanced"
                            ? "#ffedd5"
                            : "#f3e8ff",
                        color:
                          p.difficulty === "basic"
                            ? "#166534"
                            : p.difficulty === "intermediate"
                            ? "#92400e"
                            : p.difficulty === "advanced"
                            ? "#c2410c"
                            : "#6b21a8",
                      }}
                    >
                      {p.difficulty}
                    </span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-indigo)" }}>
                      +{p.xpReward} XP
                    </span>
                  </div>
                  <h3 style={{ fontSize: "0.96rem", margin: "0 0 6px 0", fontWeight: 700 }}>
                    {p.title}
                  </h3>
                  <p
                    className="muted"
                    style={{
                      fontSize: "0.82rem",
                      margin: "0 0 10px 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.summary}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <span className="muted">{p.estHours} hrs estimated</span>
                    <span style={{ fontWeight: 600, color: "var(--color-charcoal-muted)" }}>
                      {completedCount}/{p.tasks.length} tasks ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Project Detail Workspace */}
          <section className="card" style={{ padding: 24, minHeight: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <span className="badge-pill" style={{ marginBottom: 6 }}>
                  {activeProject.subject}
                </span>
                <h2 style={{ fontSize: "1.4rem", margin: "4px 0 8px 0", fontWeight: 800 }}>
                  {activeProject.title}
                </h2>
                <p className="muted" style={{ fontSize: "0.92rem", margin: 0, lineHeight: 1.5 }}>
                  {activeProject.summary}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-indigo)" }}>
                  +{activeProject.xpReward} XP
                </span>
                <div style={{ fontSize: "0.8rem", color: "var(--color-charcoal-muted)" }}>
                  Est. {activeProject.estHours} hours
                </div>
              </div>
            </div>

            {/* Navigation Tabs for Active Project */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-light)", paddingBottom: 10, marginBottom: 20 }}>
              <button
                className={`btn btn-sm ${activeTab === "details" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("details")}
              >
                Overview & Specs
              </button>
              <button
                className={`btn btn-sm ${activeTab === "checklist" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("checklist")}
              >
                Task Checklist ({activeProject.tasks.filter((t) => t.completed).length}/{activeProject.tasks.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === "submit" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveTab("submit")}
              >
                Submit & Verify
              </button>
            </div>

            {activeTab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Layers size={16} color="var(--color-indigo)" /> Prerequisites
                  </h4>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {activeProject.prerequisites.map((pr) => (
                      <span
                        key={pr}
                        style={{
                          fontSize: "0.8rem",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "var(--color-ice-silver)",
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        {pr}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={16} color="var(--color-indigo)" /> Skills Evaluated & Mastered
                  </h4>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {activeProject.skillsGained.map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: "0.8rem",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "#e0e7ff",
                          color: "#3730a3",
                          fontWeight: 600,
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: "var(--radius)",
                    background: "var(--color-ice-silver)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 6px 0" }}>
                    Starter Code Template
                  </h4>
                  <p className="muted" style={{ fontSize: "0.84rem", margin: "0 0 10px 0" }}>
                    Clone the official PragyaX template containing boilerplate, type definitions, and automated test runners.
                  </p>
                  <a
                    href={activeProject.starterTemplate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <GitBranch size={15} /> Open GitHub Starter Template <ExternalLink size={13} />
                  </a>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab("checklist")}>
                    Start Implementing Tasks <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "checklist" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p className="muted" style={{ fontSize: "0.88rem", margin: 0 }}>
                  Check off each task as you implement and test your code locally.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeProject.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border-light)",
                        background: task.completed ? "#f0fdf4" : "white",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        style={{ marginTop: 3, cursor: "pointer" }}
                      />
                      <div>
                        <strong
                          style={{
                            fontSize: "0.92rem",
                            display: "block",
                            color: task.completed ? "#166534" : "var(--color-navy)",
                            textDecoration: task.completed ? "line-through" : "none",
                          }}
                        >
                          {task.title}
                        </strong>
                        <p
                          className="muted"
                          style={{
                            fontSize: "0.82rem",
                            margin: "2px 0 0 0",
                            color: task.completed ? "#15803d" : "var(--color-charcoal-muted)",
                          }}
                        >
                          {task.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <button className="btn btn-ghost" onClick={() => setActiveTab("details")}>
                    Back to Overview
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveTab("submit")}>
                    Proceed to Submission <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "submit" && (
              <div>
                <form onSubmit={handleSubmitEvaluation} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: "0.86rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                      GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/your-username/pragyax-log-pipeline"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--border-light)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.86rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Live Demo / Deployment Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder="https://your-demo-app.com"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--border-light)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.86rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Engineering & Architecture Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe architectural tradeoffs, concurrency primitives used, or benchmark numbers..."
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--border-light)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={evaluating || !repoUrl.trim()}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {evaluating ? (
                      <>
                        <Terminal size={16} /> Running Automated Evaluation Suite…
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit for Automated Evaluation
                      </>
                    )}
                  </button>
                </form>

                {/* Evaluation Results Box */}
                {evalResult && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 18,
                      borderRadius: "var(--radius)",
                      border: "1px solid",
                      borderColor: evalResult.passed ? "#bbf7d0" : "#fed7aa",
                      background: evalResult.passed ? "#f0fdf4" : "#fff7ed",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      {evalResult.passed ? (
                        <CheckCircle2 size={24} color="#16a34a" />
                      ) : (
                        <AlertCircle size={24} color="#ea580c" />
                      )}
                      <div>
                        <strong style={{ fontSize: "1.05rem", color: evalResult.passed ? "#166534" : "#9a3412" }}>
                          {evalResult.passed ? "Project Evaluation Passed!" : "Needs Revision"}
                        </strong>
                        <div style={{ fontSize: "0.84rem", color: "var(--color-charcoal-muted)" }}>
                          Final Verification Score: <strong>{evalResult.score}/100</strong> • Awarded:{" "}
                          <strong>+{evalResult.xpEarned} XP</strong>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.88rem", margin: "8px 0 12px 0", lineHeight: 1.5 }}>
                      {evalResult.feedback}
                    </p>
                    {evalResult.passed && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveTab("portfolio")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <Trophy size={14} /> View in Your Portfolio
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
