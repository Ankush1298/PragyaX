import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Edit2,
  FileText,
  FileUp,
  Milestone,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { navigate, useLoad } from "../hooks";
import { ErrorBox, Loading } from "../components/States";

interface TopicUnit {
  id: string;
  unitTitle: string;
  topics: string[];
}

const DEFAULT_EXTRACTED_UNITS: Record<string, TopicUnit[]> = {
  subj_python: [
    {
      id: "u1",
      unitTitle: "Unit 1: Python Memory & Execution Semantics",
      topics: ["Default Parameter Evaluation", "Mutable vs Immutable Objects", "Variable Lifetime & References"],
    },
    {
      id: "u2",
      unitTitle: "Unit 2: Sequence Manipulation & Hashing",
      topics: ["Sequence Slicing with Negative Steps", "Hash Tables & Dictionary Invariance", "Tuple Hashability"],
    },
    {
      id: "u3",
      unitTitle: "Unit 3: Functional Iteration & Scope Rules",
      topics: ["List Comprehensions vs Lazy Generators", "LEGB Scoping Protocol", "Closures & nonlocal State"],
    },
  ],
  subj_math: [
    {
      id: "u1",
      unitTitle: "Unit 1: Algebraic Foundations & Systems",
      topics: ["Exponential and Logarithmic Equations", "Polynomial Root Finding", "Systems of Linear Equations"],
    },
    {
      id: "u2",
      unitTitle: "Unit 2: Differential & Integral Calculus",
      topics: ["Derivatives and Product/Chain Rules", "Related Rates of Change", "Definite Integrals & Riemann Sums"],
    },
    {
      id: "u3",
      unitTitle: "Unit 3: Vectors, Matrices & Probability",
      topics: ["Matrix Determinants & Transformations", "Combinatorics and Conditional Probability", "Random Variables"],
    },
  ],
  subj_physics: [
    {
      id: "u1",
      unitTitle: "Unit 1: Classical Mechanics & Dynamics",
      topics: ["Kinematic Equations in 2D", "Newton's Laws & Friction", "Conservation of Momentum & Energy"],
    },
    {
      id: "u2",
      unitTitle: "Unit 2: Electromagnetism & Circuits",
      topics: ["Coulomb's Law & Electric Fields", "Ohm's Law & DC Networks", "Electromagnetic Induction"],
    },
    {
      id: "u3",
      unitTitle: "Unit 3: Waves, Optics & Thermodynamics",
      topics: ["Wave Interference & Boundary Behavior", "Laws of Thermodynamics & Heat Engines", "Geometric Optics"],
    },
  ],
  subj_chemistry: [
    {
      id: "u1",
      unitTitle: "Unit 1: Atomic Structure & Bonding",
      topics: ["Aufbau Exceptions & Orbitals", "VSEPR Molecular Geometry & Hybridization", "Intermolecular Forces"],
    },
    {
      id: "u2",
      unitTitle: "Unit 2: Chemical Dynamics & Equilibrium",
      topics: ["Le Chatelier's Principle", "Acid-Base Chemistry & pH/pOH", "Reaction Kinetics & Rate Laws"],
    },
    {
      id: "u3",
      unitTitle: "Unit 3: Chemical Thermodynamics",
      topics: ["Enthalpy, Entropy & Gibbs Free Energy", "Electrochemical Cells", "Spontaneity Conditions"],
    },
  ],
  subj_biology: [
    {
      id: "u1",
      unitTitle: "Unit 1: Cellular Biology & Energy",
      topics: ["Cell Organelles & Golgi Sorting", "Photosystem II & Light Reactions", "Cellular Respiration & ATP"],
    },
    {
      id: "u2",
      unitTitle: "Unit 2: Genetics & Molecular Biology",
      topics: ["DNA Helicase & Replication Fork", "Transcription & Translation Mechanisms", "Mendelian & Non-Mendelian Genetics"],
    },
    {
      id: "u3",
      unitTitle: "Unit 3: Physiology & Evolutionary Ecology",
      topics: ["Renal Microanatomy & PCT Reabsorption", "Genetic Drift & Population Dynamics", "Ecosystem Trophic Cascades"],
    },
  ],
};

const SUGGESTED_TOPICS = [
  "Python Functions & Scope Rules",
  "Object Mutability & Memory Addresses",
  "Algebraic Systems & Logarithms",
  "Differential Calculus & Related Rates",
  "Newton's Laws of Motion & Momentum",
  "Coulomb's Law & DC Circuit Analysis",
  "VSEPR Molecular Geometry & Hybridization",
  "Gibbs Free Energy & Chemical Equilibrium",
  "DNA Replication & Helicase Enzymology",
  "Mammalian Nephron & Renal Transport",
];

export default function SyllabusPage() {
  const { data: subData, error, loading, reload } = useLoad(api.subjects);
  const [activeTab, setActiveTab] = useState<"syllabus" | "manual">("syllabus");

  // Option A State
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [units, setUnits] = useState<TopicUnit[] | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [confirmedSyllabus, setConfirmedSyllabus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option B State
  const [manualTopic, setManualTopic] = useState("");
  const [goal, setGoal] = useState("concept_mastery");
  const [generatedManualRoadmap, setGeneratedManualRoadmap] = useState(false);

  if (loading) return <Loading label="Loading subject configuration…" />;
  if (error || !subData) return <ErrorBox message={error ?? "Could not load subjects"} onRetry={reload} />;

  const activeSubject =
    subData.subjects.find((s) => s.id === subData.selected_subject_id) ?? subData.subjects[0];

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const validExtensions = [".pdf", ".docx", ".txt"];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(extension)) {
      alert("Please upload a supported syllabus document: .pdf, .docx, or .txt");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setUploadProgress(20);
    setConfirmedSyllabus(false);

    // Simulate structured parsing and topic extraction
    setTimeout(() => setUploadProgress(60), 300);
    setTimeout(() => {
      setUploadProgress(100);
      setIsProcessing(false);
      const defaults = DEFAULT_EXTRACTED_UNITS[activeSubject.id] || DEFAULT_EXTRACTED_UNITS.subj_python;
      setUnits(JSON.parse(JSON.stringify(defaults)));
    }, 700);
  };

  const removeFile = () => {
    setFile(null);
    setUnits(null);
    setUploadProgress(0);
    setConfirmedSyllabus(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTopicToUnit = (unitId: string) => {
    if (!newTopicInput.trim() || !units) return;
    setUnits(
      units.map((u) =>
        u.id === unitId ? { ...u, topics: [...u.topics, newTopicInput.trim()] } : u
      )
    );
    setNewTopicInput("");
    setEditingUnitId(null);
  };

  const deleteTopic = (unitId: string, topicIndex: number) => {
    if (!units) return;
    setUnits(
      units.map((u) =>
        u.id === unitId
          ? { ...u, topics: u.topics.filter((_, idx) => idx !== topicIndex) }
          : u
      )
    );
  };

  const confirmRoadmap = () => {
    setConfirmedSyllabus(true);
    // Persist confirmed roadmap in localStorage for roadmap view
    if (units) {
      localStorage.setItem(`pragyax_roadmap_${activeSubject.id}`, JSON.stringify(units));
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTopic.trim()) return;
    const customUnits: TopicUnit[] = [
      {
        id: "m1",
        unitTitle: `Foundations: ${manualTopic.trim()}`,
        topics: [
          `Introduction & Core Principles of ${manualTopic.trim()}`,
          `Syntax & Common Execution Patterns`,
          `Edge Cases & Boundary Mechanics`,
        ],
      },
      {
        id: "m2",
        unitTitle: `Applied Mastery: ${manualTopic.trim()}`,
        topics: [
          `Diagnostic Problem Solving`,
          `Practical Laboratory Implementation`,
          `Self-Evaluation & Assessment`,
        ],
      },
    ];
    localStorage.setItem(`pragyax_roadmap_${activeSubject.id}`, JSON.stringify(customUnits));
    setGeneratedManualRoadmap(true);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <BookOpen size={13} aria-hidden />
            <span>Active Subject: {activeSubject.title}</span>
          </div>
          <h1>Two ways to start learning</h1>
          <p className="muted">
            Upload your course syllabus for automated unit extraction, or enter specific learning
            topics manually. Both connect directly to personalized diagnostic roadmaps.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate("subjects")}>
            Change Subject
          </button>
          <button className="btn btn-primary" onClick={() => navigate("roadmap")}>
            <Milestone size={16} aria-hidden /> View Roadmap
          </button>
        </div>
      </header>

      {/* Mode Switcher Tabs */}
      <div className="clean-tabs" style={{ marginBottom: 24, maxWidth: 500 }}>
        <button
          type="button"
          className={`tab ${activeTab === "syllabus" ? "active" : ""}`}
          onClick={() => setActiveTab("syllabus")}
        >
          <FileUp size={16} aria-hidden /> Option A: Upload Syllabus
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          <Edit2 size={16} aria-hidden /> Option B: Enter Topic Manually
        </button>
      </div>

      {activeTab === "syllabus" ? (
        <div className="grid-2">
          {/* Upload & Document Panel */}
          <section className="card">
            <h2>Course Syllabus Document</h2>
            <p className="muted small">
              Supported formats: <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.txt</strong> (Max 10MB).
            </p>

            {!file ? (
              <div
                className={`upload-dropzone ${dragActive ? "drag-over" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <UploadCloud size={40} className="upload-icon" aria-hidden />
                <p className="upload-title">Drag & drop your syllabus document here</p>
                <p className="upload-sub">or click to browse your computer</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="uploaded-file-card">
                <div className="file-info-row">
                  <div className="file-icon-box">
                    <FileText size={24} />
                  </div>
                  <div className="file-meta">
                    <strong>{file.name}</strong>
                    <span className="muted small">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={removeFile}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>

                {isProcessing ? (
                  <div style={{ marginTop: 16 }}>
                    <div className="row-between" style={{ marginBottom: 6 }}>
                      <span className="small muted">Extracting units & key concepts…</span>
                      <span className="small">{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success" style={{ marginTop: 16 }}>
                    <CheckCircle2 size={16} />
                    <span>Syllabus analyzed. Review the extracted topics on the right.</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Extracted Units & Topics Editor */}
          <section className="card">
            <div className="row-between">
              <h2>Extracted Curriculum Units</h2>
              {units && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const defaults = DEFAULT_EXTRACTED_UNITS[activeSubject.id] || DEFAULT_EXTRACTED_UNITS.subj_python;
                    setUnits(JSON.parse(JSON.stringify(defaults)));
                    setConfirmedSyllabus(false);
                  }}
                  title="Reset to default extraction"
                >
                  <RefreshCw size={13} /> Reset
                </button>
              )}
            </div>

            {!units ? (
              <div className="empty-placeholder">
                <FileText size={32} className="muted" />
                <p className="muted">Upload your syllabus to extract and preview structured units.</p>
              </div>
            ) : (
              <div>
                <p className="muted small">
                  Review and customize the extracted units before generating your learning roadmap:
                </p>

                <div className="units-list">
                  {units.map((unit) => (
                    <div key={unit.id} className="unit-card">
                      <div className="unit-header">
                        <strong>{unit.unitTitle}</strong>
                        <button
                          type="button"
                          className="btn-link small"
                          onClick={() => setEditingUnitId(editingUnitId === unit.id ? null : unit.id)}
                        >
                          <Plus size={13} /> Add Topic
                        </button>
                      </div>

                      <ul className="unit-topics">
                        {unit.topics.map((t, idx) => (
                          <li key={idx} className="unit-topic-row">
                            <span>{t}</span>
                            <button
                              type="button"
                              className="topic-del-btn"
                              onClick={() => deleteTopic(unit.id, idx)}
                              title="Remove topic"
                            >
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>

                      {editingUnitId === unit.id && (
                        <div className="add-topic-form">
                          <input
                            type="text"
                            placeholder="Enter new topic title…"
                            value={newTopicInput}
                            onChange={(e) => setNewTopicInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addTopicToUnit(unit.id);
                            }}
                            className="clean-input small"
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => addTopicToUnit(unit.id)}
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  {confirmedSyllabus ? (
                    <div className="alert alert-success">
                      <CheckCircle2 size={18} />
                      <div>
                        <strong>Curriculum confirmed!</strong>
                        <p style={{ margin: "4px 0 8px 0" }}>
                          Your personalized learning roadmap is ready based on this syllabus.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate("roadmap")}
                          >
                            Go to Roadmap <ArrowRight size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate("assessment")}
                          >
                            Take Diagnostic Assessment
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={confirmRoadmap}
                    >
                      <Sparkles size={16} /> Confirm Curriculum & Generate Roadmap
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Option B: Enter Topic Manually */
        <div className="grid-2">
          <section className="card">
            <h2>Enter a Topic Manually</h2>
            <p className="muted small">
              Focus directly on a specific concept or chapter without needing a syllabus document.
            </p>

            <form onSubmit={handleManualSubmit}>
              <label className="field-group">
                <span className="field-label">Target Topic or Concept</span>
                <input
                  type="text"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  placeholder="e.g. Python Functions, Algebra, Newton's Laws…"
                  className="clean-input"
                  required
                />
              </label>

              <label className="field-group">
                <span className="field-label">Primary Learning Goal</span>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="clean-input"
                >
                  <option value="concept_mastery">Conceptual Mastery (Theory + Edge Cases)</option>
                  <option value="exam_prep">Semester Exam & Lab Viva Preparation</option>
                  <option value="interview_readiness">Technical Interview & Coding Readiness</option>
                  <option value="rapid_revision">Quick Revision & Diagnostic Check</option>
                </select>
              </label>

              <div style={{ marginTop: 16 }}>
                <span className="small muted" style={{ display: "block", marginBottom: 8 }}>
                  Or pick from popular suggested topics:
                </span>
                <div className="chips">
                  {SUGGESTED_TOPICS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="chip"
                      onClick={() => setManualTopic(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={!manualTopic.trim()}
                >
                  <Sparkles size={16} /> Generate Personalized Learning Journey
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <h2>Generated Learning Path</h2>
            {!generatedManualRoadmap ? (
              <div className="empty-placeholder">
                <Milestone size={32} className="muted" />
                <p className="muted">Enter a topic on the left to see the instant milestone roadmap.</p>
              </div>
            ) : (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <CheckCircle2 size={16} />
                  <span>
                    Learning roadmap generated for <strong>{manualTopic}</strong>!
                  </span>
                </div>

                <div className="journey-summary-box">
                  <h3>Curriculum Outline</h3>
                  <ul className="checklist">
                    <li className="done">
                      <span className="check">✓</span>
                      <span>1. Foundations & Definition: {manualTopic}</span>
                    </li>
                    <li className="done">
                      <span className="check">✓</span>
                      <span>2. Practical Syntax, Formulas & Mechanics</span>
                    </li>
                    <li>
                      <span className="check" />
                      <span>3. Diagnostic 5-Question Evaluation</span>
                    </li>
                    <li>
                      <span className="check" />
                      <span>4. AI Chat Remediation & Counter-Examples</span>
                    </li>
                  </ul>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate("roadmap")}
                  >
                    Open Roadmap <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate("chat")}
                  >
                    Study in Chat
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate("assessment")}
                  >
                    Take Assessment
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
