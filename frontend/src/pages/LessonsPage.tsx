import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { api } from "../api/client";
import { navigate, useLoad } from "../hooks";
import { ErrorBox, Loading } from "../components/States";
import Markdown from "../components/Markdown";

interface Lesson {
  id: string;
  subjectId: string;
  title: string;
  topic: string;
  objectives: string[];
  content: string;
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const LESSON_CATALOG: Lesson[] = [
  // Python Lessons
  {
    id: "py_lesson_1",
    subjectId: "subj_python",
    title: "Lesson 1: Default Parameter Evaluation & Mutability Trap",
    topic: "Default Parameter Evaluation & Mutability",
    objectives: [
      "Understand when Python evaluates default argument expressions",
      "Differentiate mutable defaults (list, dict) from immutable defaults (None, int, tuple)",
      "Implement the canonical `None` sentinel pattern for safe defaults",
    ],
    content: `### Execution Semantics of Default Arguments

In Python, default parameter expressions are evaluated **once only**, at the exact moment the \`def\` statement is executed by the bytecode interpreter—**never** on each subsequent call.

\`\`\`python
# ANTI-PATTERN: The shared mutable container trap
def collect(item, store=[]):
    store.append(item)
    return store

print(collect(1))  # Returns: [1]
print(collect(2))  # Returns: [1, 2] -- The same list instance in RAM!
\`\`\`

#### Why Does This Occur?
The Python function object has an internal \`__defaults__\` attribute tuple holding references to the default objects. Because lists are mutable, calling \`.append()\` mutates that persistent object in memory.

#### The Idiomatic Fix: Sentinel Pattern
Always use \`None\` as the default sentinel and instantiate a fresh container inside the function body:

\`\`\`python
def collect(item, store=None):
    if store is None:
        store = []
    store.append(item)
    return store
\`\`\`
`,
    quickCheck: {
      question: "When are default argument expressions evaluated in Python?",
      options: [
        "Each time the function is called",
        "Once at the time the function is defined in memory",
        "Only when the caller explicitly passes None",
        "During garbage collection",
      ],
      correctIndex: 1,
      explanation: "Default expressions are evaluated once when the function definition is executed, storing the resulting objects in `func.__defaults__`.",
    },
  },
  {
    id: "py_lesson_2",
    subjectId: "subj_python",
    title: "Lesson 2: Sequence Slicing with Negative Steps",
    topic: "Sequence Slicing & Negative Steps",
    objectives: [
      "Master the three-component slicing notation: `[start:stop:step]`",
      "Predict output when step is negative (-1, -2)",
      "Explain why `data[1:4:-1]` produces an empty list `[]`",
    ],
    content: `### Mechanics of Negative Slice Stepping

Python sequences support extended slicing: \`seq[start:stop:step]\`.

- When \`step > 0\`: traversal proceeds from left to right (incrementing index). Default start is 0, default stop is len(seq).
- When \`step < 0\`: traversal proceeds from right to left (decrementing index). Default start is -1, default stop is conceptually before index 0.

\`\`\`python
data = [10, 20, 30, 40, 50]

# Forward slice:
data[1:4]     # [20, 30, 40]

# Reverse slice from index 3 down to 1:
data[3:0:-1]  # [40, 30, 20]

# Why does data[1:4:-1] return []?
# Because start (1) is already less than stop (4). When step is negative,
# the loop cannot reach 4 by decrementing, terminating immediately!
\`\`\`
`,
    quickCheck: {
      question: "What does `data = [1, 2, 3, 4]; data[::-1]` evaluate to?",
      options: ["[1, 2, 3, 4]", "[4, 3, 2, 1]", "[]", "IndexError"],
      correctIndex: 1,
      explanation: "`[::-1]` reverses the entire sequence by starting from the last item down to the first.",
    },
  },
  // Mathematics Lesson
  {
    id: "math_lesson_1",
    subjectId: "subj_math",
    title: "Lesson 1: Differential Calculus & The Product/Chain Rule",
    topic: "Calculus",
    objectives: [
      "Derive the product rule: d/dx [u · v] = u'v + uv'",
      "Apply chain rule to composite functions f(g(x))",
      "Calculate instantaneous rates of change in physical contexts",
    ],
    content: `### The Product Rule for Differentiation

When differentiating the product of two differentiable functions $f(x) = u(x) \\cdot v(x)$, the derivative is **not** simply $u'(x) \\cdot v'(x)$.

$$\\frac{d}{dx}[u \\cdot v] = u' \\cdot v + u \\cdot v'$$

#### Example Walkthrough
Consider $f(x) = x^2 \\cdot e^x$:
- Let $u = x^2 \\implies u' = 2x$
- Let $v = e^x \\implies v' = e^x$

Applying the product rule:
$$f'(x) = (2x)(e^x) + (x^2)(e^x) = e^x(x^2 + 2x)$$
`,
    quickCheck: {
      question: "If f(x) = x · sin(x), what is f'(x)?",
      options: ["sin(x) + x · cos(x)", "x · cos(x)", "cos(x)", "1 + cos(x)"],
      correctIndex: 0,
      explanation: "Using product rule: d/dx[x] · sin(x) + x · d/dx[sin(x)] = 1 · sin(x) + x · cos(x).",
    },
  },
  // Physics Lesson
  {
    id: "phys_lesson_1",
    subjectId: "subj_physics",
    title: "Lesson 1: Conservation of Energy & Work-Energy Theorem",
    topic: "Work, Energy & Power",
    objectives: [
      "Formulate the Work-Energy Theorem: W_net = ΔK",
      "Analyze isolated systems with conservative forces",
      "Calculate energy transformations between kinetic (0.5mv²) and potential (mgh)",
    ],
    content: `### The Work-Energy Theorem & Energy Conservation

The total work done by all forces acting on a particle equals the change in its kinetic energy:

$$W_{\\text{net}} = \\Delta K = K_f - K_i = \\frac{1}{2}m v_f^2 - \\frac{1}{2}m v_i^2$$

#### Conservative vs Non-Conservative Forces
- **Conservative forces** (Gravity, Ideal springs): Work done is path-independent. Mechanical energy $E = K + U$ is strictly conserved.
- **Non-conservative forces** (Friction, Drag): Convert mechanical energy into thermal energy:
$$W_{\\text{nc}} = \\Delta E_{\\text{mech}}$$
`,
    quickCheck: {
      question: "A ball of mass 2 kg is dropped from a height of 5 meters (g = 9.8 m/s²). What is its kinetic energy just before hitting the ground?",
      options: ["49 J", "98 J", "196 J", "0 J"],
      correctIndex: 1,
      explanation: "By conservation of energy, initial potential energy mgh = 2 × 9.8 × 5 = 98 Joules converts entirely to kinetic energy.",
    },
  },
  // Chemistry Lesson
  {
    id: "chem_lesson_1",
    subjectId: "subj_chemistry",
    title: "Lesson 1: VSEPR Molecular Geometry & Hybridization",
    topic: "Chemical Bonding & Molecular Geometry",
    objectives: [
      "Calculate steric numbers using valence electron pairs",
      "Predict molecular geometry minimizing electron-electron repulsion",
      "Correlate steric numbers with sp, sp², sp³, sp³d, and sp³d² hybridizations",
    ],
    content: `### VSEPR Theory (Valence Shell Electron Pair Repulsion)

Electron pairs in bonds and lone pairs arrange themselves around a central atom to minimize electrostatic repulsions.

| Steric Number | Lone Pairs | Electron Geometry | Molecular Shape | Hybridization | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2** | 0 | Linear | Linear | $sp$ | $CO_2$ |
| **3** | 0 | Trigonal Planar | Trigonal Planar | $sp^2$ | $BF_3$ |
| **4** | 0 | Tetrahedral | Tetrahedral | $sp^3$ | $CH_4$ |
| **4** | 1 | Tetrahedral | Trigonal Pyramidal| $sp^3$ | $NH_3$ |
| **4** | 2 | Tetrahedral | Bent | $sp^3$ | $H_2O$ |
| **6** | 0 | Octahedral | Octahedral | $sp^3d^2$ | $SF_6$ |
`,
    quickCheck: {
      question: "What is the hybridization and molecular geometry of SF₆?",
      options: [
        "sp³d² and Octahedral",
        "sp³ and Tetrahedral",
        "dsp² and Square Planar",
        "sp³d and Trigonal Bipyramidal",
      ],
      correctIndex: 0,
      explanation: "Sulfur in SF₆ has 6 single bonds and zero lone pairs (steric number = 6), adopting an octahedral geometry with sp³d² hybridization.",
    },
  },
  // Biology Lesson
  {
    id: "bio_lesson_1",
    subjectId: "subj_biology",
    title: "Lesson 1: Cellular Organelles & Vesicle Trafficking",
    topic: "Cell Biology & Organelles",
    objectives: [
      "Detail the endomembrane system: Rough ER → Golgi Apparatus → Target Destination",
      "Explain post-translational protein modification (glycosylation, phosphorylation)",
      "Contrast lysosomes, peroxisomes, and secretome sorting",
    ],
    content: `### Protein Sorting in the Endomembrane System

Proteins synthesized by ribosomes on the **Rough Endoplasmic Reticulum (RER)** are translocated into the ER lumen, folded with chaperones, and packaged into COPII-coated transport vesicles.

#### The Golgi Apparatus Function
1. **Cis Face**: Receives transport vesicles from the RER.
2. **Medial Cisternae**: Catalyzes post-translational modifications (mannose trimming, complex N-linked glycosylation, O-linked glycosylation).
3. **Trans-Golgi Network (TGN)**: Sorts modified proteins into specific vesicles directed to lysosomes, secretome granules, or the plasma membrane.
`,
    quickCheck: {
      question: "Which organelle is primarily responsible for sorting and glycosylating proteins before shipping?",
      options: ["Lysosome", "Golgi apparatus", "Smooth ER", "Nucleolus"],
      correctIndex: 1,
      explanation: "The Golgi apparatus modifies, sorts, and packages proteins received from the rough endoplasmic reticulum.",
    },
  },
];

export default function LessonsPage() {
  const { data: subData, error, loading, reload } = useLoad(api.subjects);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("py_lesson_1");
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCheckResult, setShowCheckResult] = useState(false);

  if (loading) return <Loading label="Loading structured lessons…" />;
  if (error || !subData) return <ErrorBox message={error ?? "Could not load subjects"} onRetry={reload} />;

  const activeSubject =
    subData.subjects.find((s) => s.id === subData.selected_subject_id) ?? subData.subjects[0];

  // Filter lessons for active subject, or fallback to all lessons if none match
  const subjectLessons = LESSON_CATALOG.filter((l) => l.subjectId === activeSubject.id);
  const availableLessons = subjectLessons.length > 0 ? subjectLessons : LESSON_CATALOG;

  const currentLesson =
    availableLessons.find((l) => l.id === selectedLessonId) ?? availableLessons[0];
  const currentIndex = availableLessons.findIndex((l) => l.id === currentLesson.id);

  const toggleComplete = (id: string) => {
    setCompletedLessons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkAnswer = () => {
    if (selectedAnswer !== null) {
      setShowCheckResult(true);
    }
  };

  const selectLesson = (id: string) => {
    setSelectedLessonId(id);
    setSelectedAnswer(null);
    setShowCheckResult(false);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <BookOpen size={13} aria-hidden />
            <span>Active Curriculum: {activeSubject.title}</span>
          </div>
          <h1>Structured Theory Lessons</h1>
          <p className="muted">
            High-yield conceptual notes, execution semantics, and embedded comprehension checks.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate("chat")}>
            <MessageSquare size={15} /> Ask AI Tutor
          </button>
          <button className="btn btn-primary" onClick={() => navigate("assessment")}>
            Prove with Assessment
          </button>
        </div>
      </header>

      <div className="grid-sidebar-main">
        {/* Left: Lessons Navigation Sidebar */}
        <aside className="card lesson-nav-card">
          <h2 style={{ fontSize: "1rem", marginBottom: 12 }}>Lessons in Track</h2>
          <ul className="lesson-nav-list">
            {availableLessons.map((les, idx) => {
              const isSelected = les.id === currentLesson.id;
              const isDone = completedLessons[les.id];

              return (
                <li key={les.id}>
                  <button
                    type="button"
                    className={`lesson-nav-btn ${isSelected ? "active" : ""}`}
                    onClick={() => selectLesson(les.id)}
                  >
                    <span className="lesson-status-icon">
                      {isDone ? (
                        <CheckCircle2 size={16} className="ok-icon" />
                      ) : (
                        <Circle size={16} className="muted" />
                      )}
                    </span>
                    <div className="lesson-nav-text">
                      <span className="lesson-nav-num">Lesson {idx + 1}</span>
                      <strong className="lesson-nav-title">{les.title.split(": ")[1] || les.title}</strong>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-block"
              onClick={() => navigate("subjects")}
            >
              Change Subject Track
            </button>
          </div>
        </aside>

        {/* Right: Main Lesson Reading Pane */}
        <article className="card lesson-content-pane">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <span className="badge">{currentLesson.topic}</span>
            <button
              type="button"
              className={`btn btn-sm ${completedLessons[currentLesson.id] ? "btn-ghost" : "btn-primary"}`}
              onClick={() => toggleComplete(currentLesson.id)}
            >
              <CheckCircle2 size={14} />
              {completedLessons[currentLesson.id] ? "Completed ✓" : "Mark Complete"}
            </button>
          </div>

          <h2 style={{ fontSize: "1.5rem", marginBottom: 16 }}>{currentLesson.title}</h2>

          {/* Learning Objectives Callout */}
          <div className="lesson-objectives-box">
            <strong>Key Learning Objectives:</strong>
            <ul>
              {currentLesson.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Core Lesson Body */}
          <div className="lesson-markdown-body">
            <Markdown text={currentLesson.content} />
          </div>

          {/* Embedded Quick Check Quiz */}
          <div className="lesson-quick-check-card">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <strong>
                <Sparkles size={16} className="accent-icon" /> Conceptual Quick Check
              </strong>
              <span className="small muted">Self-assessment</span>
            </div>

            <p style={{ fontWeight: 600, marginBottom: 12 }}>
              {currentLesson.quickCheck.question}
            </p>

            <div className="options" style={{ marginBottom: 16 }}>
              {currentLesson.quickCheck.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentLesson.quickCheck.correctIndex;
                let optClass = "";
                if (showCheckResult) {
                  if (isCorrect) optClass = "correct";
                  else if (isSelected) optClass = "wrong";
                } else if (isSelected) {
                  optClass = "chosen";
                }

                return (
                  <label key={idx} className={`option ${optClass}`}>
                    <input
                      type="radio"
                      name="quickCheck"
                      disabled={showCheckResult}
                      checked={isSelected}
                      onChange={() => setSelectedAnswer(idx)}
                    />
                    <span className="option-key">{String.fromCharCode(65 + idx)}</span>
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>

            {!showCheckResult ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={selectedAnswer === null}
                onClick={checkAnswer}
              >
                Verify Answer
              </button>
            ) : (
              <div
                className={`alert ${selectedAnswer === currentLesson.quickCheck.correctIndex ? "alert-success" : "alert-error"}`}
              >
                <div>
                  <strong>
                    {selectedAnswer === currentLesson.quickCheck.correctIndex
                      ? "Correct! Excellent deduction."
                      : "Incorrect."}
                  </strong>
                  <p style={{ margin: "4px 0 0" }}>{currentLesson.quickCheck.explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Lesson Navigation Controls */}
          <div className="row-between" style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={currentIndex <= 0}
              onClick={() => selectLesson(availableLessons[currentIndex - 1].id)}
            >
              <ArrowLeft size={15} /> Previous Lesson
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate("chat")}
            >
              <MessageSquare size={15} /> Discuss in Chat
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={currentIndex >= availableLessons.length - 1}
              onClick={() => selectLesson(availableLessons[currentIndex + 1].id)}
            >
              Next Lesson <ArrowRight size={15} />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
