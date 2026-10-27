import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Award,
  Bot,
  BrainCircuit,
  FileCode2,
  GraduationCap,
  Lock,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import type { User } from "../api/types";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { ProductPreview } from "../components/ui/ProductPreview";

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;

export default function AuthPage({
  onAuth,
}: {
  readonly onAuth: (u: User, token: string, isNew: boolean) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const cycleRef = useRef<HTMLElement>(null);
  const curriculumRef = useRef<HTMLElement>(null);
  const capabilitiesRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    if (mode === "register" && name.trim().length < 2) {
      return "Please enter your full name (at least 2 characters).";
    }
    if (!EMAIL_RE.test(email.trim())) {
      return "Please enter a valid academic or personal email address.";
    }
    if (mode === "register" && password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (!password) {
      return "Please enter your password.";
    }
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "register"
          ? await api.register(name.trim(), email.trim(), password)
          : await api.login(email.trim(), password);
      onAuth(res.user, res.token, mode === "register");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError(null);
    setTimeout(() => {
      if (m === "register") {
        nameInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    }, 50);
  };

  const focusAuth = (preferredMode: "login" | "register" = "register") => {
    switchMode(preferredMode);
    accountRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const fillDemoStudent = () => {
    setMode("login");
    setEmail("student@college.edu");
    setPassword("demopassword123");
    setError(null);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
  };

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-shell-clean">
      {/* Top Clean Minimal Navigation Bar */}
      <header className="clean-nav">
        <div className="clean-nav-container">
          <a href="#/" className="brand-logo">
            <div className="brand-icon-box">
              <GraduationCap size={20} aria-hidden />
            </div>
            <span className="brand-title">
              Pragya<span className="brand-accent">X</span>
            </span>
          </a>

          <nav className="clean-nav-links" aria-label="Landing Navigation">
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection(cycleRef)}
            >
              Learning Cycle
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection(curriculumRef)}
            >
              Curriculum
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection(capabilitiesRef)}
            >
              Capabilities
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection(testimonialsRef)}
            >
              Testimonials
            </button>
          </nav>

          <div className="clean-nav-actions">
            <button
              type="button"
              className="btn-link"
              onClick={() => focusAuth("login")}
            >
              Sign in
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => focusAuth("register")}
            >
              Start Learning Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section: Value Proposition & Interactive Product Preview */}
      <section className="clean-hero-section">
        <div className="clean-hero-container">
          {/* Left Column: Headline, Value Props, and Auth Card */}
          <div className="clean-hero-copy">
            <div className="badge-pill">
              <Sparkles size={14} className="badge-pill-icon" aria-hidden />
              <span>AI-Powered Practical Learning</span>
            </div>

            <h1 className="clean-hero-headline">
              Transform theory into <span className="text-gradient">verifiable skill.</span>
            </h1>

            <p className="clean-hero-lead">
              PragyaX combines rapid diagnostic evaluations, contextual AI tutoring,
              and objective server-evaluated code challenges to help students master
              practical software concepts with proven results.
            </p>

            {/* Seamless Authentication Card */}
            <div className="clean-auth-card" ref={accountRef} id="account">
              <div className="auth-card-top-row">
                <div className="clean-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "register"}
                    className={mode === "register" ? "tab active" : "tab"}
                    onClick={() => switchMode("register")}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "login"}
                    className={mode === "login" ? "tab active" : "tab"}
                    onClick={() => switchMode("login")}
                  >
                    Sign in
                  </button>
                </div>

                <button
                  type="button"
                  className="demo-autofill-btn"
                  onClick={fillDemoStudent}
                  title="Fill demo credentials for testing"
                >
                  <Zap size={12} aria-hidden /> Demo login
                </button>
              </div>

              <form onSubmit={submit} noValidate className="clean-auth-form">
                {mode === "register" && (
                  <label className="field-group">
                    <span className="field-label">Full name</span>
                    <input
                      ref={nameInputRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Asha Sharma"
                      className="clean-input"
                    />
                  </label>
                )}

                <label className="field-group">
                  <span className="field-label">Email address</span>
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@college.edu"
                    className="clean-input"
                  />
                </label>

                <label className="field-group">
                  <span className="field-label">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                    className="clean-input"
                  />
                </label>

                {error && <Alert variant="error" message={error} />}

                <Button
                  type="submit"
                  variant="primary"
                  block
                  disabled={busy}
                  loading={busy}
                >
                  {mode === "register" ? "Start Learning Free" : "Sign in to Dashboard"}
                </Button>
              </form>

              <div className="auth-card-meta">
                <span className="meta-text">
                  <Lock size={12} aria-hidden /> Local session persistence · Offline mode enabled
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Product UI Preview */}
          <div className="clean-hero-preview">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Section C: The 5-Stage Learning Cycle (ASSESS -> PERSONALIZE -> PRACTICE -> PROVE -> IMPROVE) */}
      <section id="cycle" ref={cycleRef} className="section-white">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">THE PRAGYAX LEARNING CYCLE</span>
            <h2 className="section-title">A continuous loop from theory to verifiable ability.</h2>
            <p className="section-subtitle">
              Unlike static textbook readings or passive video lectures, PragyaX follows a
              rigorous 5-stage pedagogical loop to identify gaps and build true conceptual mastery.
            </p>
          </div>

          <div className="cycle-timeline-grid">
            {/* Step 1 */}
            <div className="cycle-card">
              <div className="cycle-step-header">
                <span className="cycle-step-num">01</span>
                <span className="cycle-tag">DIAGNOSTIC</span>
              </div>
              <div className="cycle-icon-box">
                <Target size={22} aria-hidden />
              </div>
              <h3 className="cycle-card-title">ASSESS</h3>
              <p className="cycle-card-desc">
                Pinpoint your precise baseline with focused 5-question diagnostics testing core
                semantics like LEGB scope, mutability, and aliasing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="cycle-card">
              <div className="cycle-step-header">
                <span className="cycle-step-num">02</span>
                <span className="cycle-tag">TARGETED</span>
              </div>
              <div className="cycle-icon-box">
                <BrainCircuit size={22} aria-hidden />
              </div>
              <h3 className="cycle-card-title">PERSONALIZE</h3>
              <p className="cycle-card-desc">
                Server-side diagnostics automatically formulate customized study roadmaps based
                directly on the specific questions you missed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="cycle-card">
              <div className="cycle-step-header">
                <span className="cycle-step-num">03</span>
                <span className="cycle-tag">INTERACTIVE</span>
              </div>
              <div className="cycle-icon-box">
                <Bot size={22} aria-hidden />
              </div>
              <h3 className="cycle-card-title">PRACTICE</h3>
              <p className="cycle-card-desc">
                Engage in guided dialogue with the AI Learning Assistant. Explore counter-examples,
                syntax edge cases, and solve daily bite-sized puzzles.
              </p>
            </div>

            {/* Step 4 */}
            <div className="cycle-card">
              <div className="cycle-step-header">
                <span className="cycle-step-num">04</span>
                <span className="cycle-tag">EVALUATED</span>
              </div>
              <div className="cycle-icon-box">
                <ShieldCheck size={22} aria-hidden />
              </div>
              <h3 className="cycle-card-title">PROVE</h3>
              <p className="cycle-card-desc">
                Demonstrate genuine ability through server-evaluated assessments that provide
                instant objective grading and comprehensive explanations.
              </p>
            </div>

            {/* Step 5 */}
            <div className="cycle-card">
              <div className="cycle-step-header">
                <span className="cycle-step-num">05</span>
                <span className="cycle-tag">MEASURED</span>
              </div>
              <div className="cycle-icon-box">
                <Trophy size={22} aria-hidden />
              </div>
              <h3 className="cycle-card-title">IMPROVE</h3>
              <p className="cycle-card-desc">
                Track your longitudinal scorecards, climb from Beginner to Advanced proficiency,
                and earn verifiable digital achievement badges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: Core Platform Capabilities */}
      <section id="capabilities" ref={capabilitiesRef} className="section-soft">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">PLATFORM CAPABILITIES</span>
            <h2 className="section-title">Engineered for academic depth and technical clarity.</h2>
            <p className="section-subtitle">
              Everything built into PragyaX serves one purpose: helping students understand how code
              actually operates under the hood.
            </p>
          </div>

          <div className="features-grid-3x2">
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Target size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Adaptive Assessments</h3>
              <p className="feature-body">
                Questions are graded objectively on the backend. No vague multiple-choice fluff—each
                problem tests real language mechanics and common misconceptions.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Bot size={20} aria-hidden />
              </div>
              <h3 className="feature-title">AI Learning Assistant</h3>
              <p className="feature-body">
                Integrated chat trained on core programming pedagogy. Features syntax-highlighted code
                examples, persistent history, and intelligent follow-up suggestions.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <BrainCircuit size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Dynamic Roadmaps</h3>
              <p className="feature-body">
                Recommendations aren't generic. When you miss a question on function scope or list
                mutability, your roadmap dynamically updates with exact remediation topics.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Zap size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Daily Code Breakers</h3>
              <p className="feature-body">
                Solve a new bite-sized code snippet puzzle every day. Earn bonus points, maintain
                daily study momentum, and unlock the Daily Code Breaker badge.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Award size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Verifiable Badges</h3>
              <p className="feature-body">
                Earn tangible digital credentials as you hit key milestones: First Assessment, Chat
                Explorer, Python Foundation Mastery, and High Score ratings.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <FileCode2 size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Deterministic Local Mode</h3>
              <p className="feature-body">
                Runs completely offline with local SQLite file-backed persistence and deterministic
                mock AI providers for zero setup friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section E: Curriculum Showcase */}
      <section id="curriculum" ref={curriculumRef} className="section-white">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">CURRICULUM TRACKS</span>
            <h2 className="section-title">Deep foundational mastery in core programming languages.</h2>
            <p className="section-subtitle">
              Explore our structured modules designed to bridge the gap between classroom theory and
              practical software development.
            </p>
          </div>

          <div className="curriculum-showcase-box">
            <div className="curriculum-track-header">
              <div className="track-left">
                <div className="track-badge">ACTIVE CURRICULUM</div>
                <h3 className="track-title">Python Programming: Core Mechanics & Semantics</h3>
                <p className="track-desc">
                  Covers the fundamental conceptual model of Python execution, memory allocation,
                  scope resolution, and data structure behavior.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => focusAuth("register")}
              >
                Enroll & Take Diagnostic
              </Button>
            </div>

            <div className="curriculum-topics-grid">
              <div className="topic-col">
                <span className="topic-num">01</span>
                <h4>Variables & Memory Aliasing</h4>
                <p>Identity (`is`) vs Equality (`==`), variable referencing, and object IDs.</p>
              </div>
              <div className="topic-col">
                <span className="topic-num">02</span>
                <h4>The LEGB Scope Rule</h4>
                <p>Local, Enclosing, Global, Built-in scope resolution and `global`/`nonlocal`.</p>
              </div>
              <div className="topic-col">
                <span className="topic-num">03</span>
                <h4>Mutability & Default Args</h4>
                <p>Why mutable default parameters cause persistent state bugs between calls.</p>
              </div>
              <div className="topic-col">
                <span className="topic-num">04</span>
                <h4>List & Dict Comprehensions</h4>
                <p>Idiomatic transformations, nested conditionals, and memory efficiency.</p>
              </div>
            </div>

            <div className="curriculum-upcoming-banner">
              <span className="upcoming-label">UPCOMING EXPANSIONS:</span>
              <span className="upcoming-pill">Data Structures & Complexity</span>
              <span className="upcoming-pill">Web System Architecture</span>
              <span className="upcoming-pill">Algorithms & Graph Traversal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section F: Student & Academic Social Proof */}
      <section id="testimonials" ref={testimonialsRef} className="section-soft">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">STUDENT IMPACT</span>
            <h2 className="section-title">Trusted by students proving their practical ability.</h2>
            <p className="section-subtitle">
              Here is what learners and instructors have to say about the PragyaX diagnostic loop.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <Quote className="quote-icon" size={24} aria-hidden />
              <p className="quote-body">
                "PragyaX replaced passive textbook reading with actual evaluation. The 5-question
                assessment immediately exposed where my mental model of Python scope was flawed."
              </p>
              <div className="quote-author">
                <div className="author-avatar">AS</div>
                <div>
                  <strong>Asha Sharma</strong>
                  <span>2nd Year Computer Science Student</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <Quote className="quote-icon" size={24} aria-hidden />
              <p className="quote-body">
                "The AI tutor dialogues don't just give answers—they explain the exact execution
                semantics. It helped me understand default argument mutability in 10 minutes."
              </p>
              <div className="quote-author">
                <div className="author-avatar">RP</div>
                <div>
                  <strong>Rohan Patel</strong>
                  <span>Software Engineering Undergraduate</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <Quote className="quote-icon" size={24} aria-hidden />
              <p className="quote-body">
                "We recommend PragyaX to students preparing for practical coding labs. The verified
                scorecards and diagnostic roadmaps make self-paced learning truly measurable."
              </p>
              <div className="quote-author">
                <div className="author-avatar">DK</div>
                <div>
                  <strong>Prof. D. Kulkarni</strong>
                  <span>Department of Computer Applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section G: Final Call to Action */}
      <section className="section-cta-banner">
        <div className="cta-banner-container">
          <h2 className="cta-title">Ready to verify your practical programming skills?</h2>
          <p className="cta-subtitle">
            Join PragyaX today. Free diagnostic evaluation, personalized AI tutoring, and verified
            skill scorecards.
          </p>
          <div className="cta-action-row">
            <Button
              variant="primary"
              size="lg"
              onClick={() => focusAuth("register")}
            >
              Start Free Assessment <ArrowRight size={16} aria-hidden />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={fillDemoStudent}
            >
              Sign In with Demo Account
            </Button>
          </div>
        </div>
      </section>

      {/* Section H: Comprehensive Modern SaaS Footer */}
      <footer className="clean-footer">
        <div className="footer-container">
          <div className="footer-columns-grid">
            {/* Column 1: Brand & Operational Status */}
            <div className="footer-col brand-col">
              <div className="brand-logo footer-logo">
                <div className="brand-icon-box">
                  <GraduationCap size={18} aria-hidden />
                </div>
                <span className="brand-title">
                  Pragya<span className="brand-accent">X</span>
                </span>
              </div>
              <p className="footer-brand-desc">
                An AI-powered personalized learning platform that transforms theoretical knowledge
                into verifiable practical ability through adaptive diagnostics and active practice.
              </p>
              <div className="system-status-indicator">
                <span className="status-dot-active" />
                <span>All systems operational · SQLite File-Backed</span>
              </div>
            </div>

            {/* Column 2: The Learning Cycle */}
            <div className="footer-col">
              <h4 className="footer-heading">Learning Cycle</h4>
              <ul className="footer-links">
                <li><a href="#cycle" onClick={(e) => { e.preventDefault(); scrollToSection(cycleRef); }}>01 / Assess Diagnostic</a></li>
                <li><a href="#cycle" onClick={(e) => { e.preventDefault(); scrollToSection(cycleRef); }}>02 / Personalize Roadmap</a></li>
                <li><a href="#cycle" onClick={(e) => { e.preventDefault(); scrollToSection(cycleRef); }}>03 / Practice AI Chat</a></li>
                <li><a href="#cycle" onClick={(e) => { e.preventDefault(); scrollToSection(cycleRef); }}>04 / Prove Evaluations</a></li>
                <li><a href="#cycle" onClick={(e) => { e.preventDefault(); scrollToSection(cycleRef); }}>05 / Improve Badges</a></li>
              </ul>
            </div>

            {/* Column 3: Curriculum & Tools */}
            <div className="footer-col">
              <h4 className="footer-heading">Curriculum Tracks</h4>
              <ul className="footer-links">
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Python Foundation Track</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>LEGB Function Scope</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Object Mutability & Memory</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Daily Code Breaker</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Scorecard Analytics</a></li>
              </ul>
            </div>

            {/* Column 4: Platform & Integrity */}
            <div className="footer-col">
              <h4 className="footer-heading">Platform & Trust</h4>
              <ul className="footer-links">
                <li><a href="#account" onClick={(e) => { e.preventDefault(); focusAuth("login"); }}>Student Authentication</a></li>
                <li><a href="#account" onClick={(e) => { e.preventDefault(); focusAuth("register"); }}>Account Registration</a></li>
                <li><a href="#capabilities" onClick={(e) => { e.preventDefault(); scrollToSection(capabilitiesRef); }}>System Architecture</a></li>
                <li><a href="#capabilities" onClick={(e) => { e.preventDefault(); scrollToSection(capabilitiesRef); }}>PBKDF2 Password Security</a></li>
                <li><a href="#capabilities" onClick={(e) => { e.preventDefault(); scrollToSection(capabilitiesRef); }}>Academic Honor Code</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright and Policy Links */}
          <div className="footer-bottom-bar">
            <span className="copyright-text">
              © {new Date().getFullYear()} PragyaX Learning Technologies. Built for student success.
            </span>
            <div className="footer-legal-links">
              <span>Privacy Policy</span>
              <span>·</span>
              <span>Terms of Service</span>
              <span>·</span>
              <span>Academic Integrity</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
