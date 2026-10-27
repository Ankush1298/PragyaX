import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  Code2,
  Compass,
  Eye,
  EyeOff,
  FileUp,
  GraduationCap,
  Lock,
  Milestone,
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const problemRef = useRef<HTMLElement>(null);
  const cycleRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const curriculumRef = useRef<HTMLElement>(null);
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
              onClick={() => scrollToSection(heroRef)}
            >
              Product
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection(cycleRef)}
            >
              How It Works
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection(featuresRef)}
            >
              Features
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
              onClick={() => scrollToSection(testimonialsRef)}
            >
              Reviews
            </button>
          </nav>

          <div className="clean-nav-actions">
            <button
              type="button"
              className="btn-link"
              onClick={() => focusAuth("login")}
            >
              Sign In
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => focusAuth("register")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section: Value Proposition & Interactive Product Preview */}
      <section ref={heroRef} className="clean-hero-section">
        <div className="clean-hero-container">
          {/* Left Column: Headline, Value Props, and Auth Card */}
          <div className="clean-hero-copy">
            <div className="badge-pill">
              <Sparkles size={14} className="badge-pill-icon" aria-hidden />
              <span>AI-Powered Practical Learning</span>
            </div>

            <h1 className="clean-hero-headline">
              Learn with direction. <span className="text-gradient">Progress with confidence.</span>
            </h1>

            <p className="clean-hero-lead">
              Choose your subject, upload your syllabus or enter a topic, and build a learning
              journey around your goals. PragyaX combines diagnostic evaluations, contextual AI
              tutoring, and verified skill scorecards.
            </p>

            {/* CTA action buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => focusAuth("register")}
              >
                Start Learning <ArrowRight size={15} />
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => scrollToSection(cycleRef)}
              >
                Explore How It Works
              </Button>
            </div>

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
                  title="Fill demo student credentials"
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
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                      className="clean-input"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
                  <Lock size={12} aria-hidden /> SQLite File-Backed Session · Offline Mode Active
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Authentic Product Preview */}
          <div className="clean-hero-preview">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Section B: Problem and Solution (Helping Students Succeed) */}
      <section ref={problemRef} className="section-soft">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">THE PRAGYAX ADVANTAGE</span>
            <h2 className="section-title">How PragyaX transforms student learning.</h2>
            <p className="section-subtitle">
              Traditional platforms present passive lectures. PragyaX provides immediate clarity on
              what you know, where you struggle, and what to study next.
            </p>
          </div>

          <div className="features-grid-3x2">
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Target size={20} aria-hidden />
              </div>
              <h3 className="feature-title">1. Identify Knowledge Gaps</h3>
              <p className="feature-body">
                Take rapid 5-question diagnostic evaluations that test core execution mechanics,
                uncovering hidden misconceptions in minutes.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Bot size={20} aria-hidden />
              </div>
              <h3 className="feature-title">2. Understand Difficult Topics</h3>
              <p className="feature-body">
                Interact with a contextual AI tutor trained on foundational pedagogy that explains
                why code executes the way it does without giving away answers.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <BrainCircuit size={20} aria-hidden />
              </div>
              <h3 className="feature-title">3. Decide What to Learn Next</h3>
              <p className="feature-body">
                Receive dynamic, objective study recommendations formulated directly from the
                specific questions you missed in assessments.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Code2 size={20} aria-hidden />
              </div>
              <h3 className="feature-title">4. Practice Concepts Actively</h3>
              <p className="feature-body">
                Solve Daily Code Breaker puzzles, experiment in the interactive sandbox, and test
                your speed in live 1v1 peer quiz battles.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={20} aria-hidden />
              </div>
              <h3 className="feature-title">5. Measure Improvement</h3>
              <p className="feature-body">
                Track longitudinal scorecards, proficiency levels (Beginner to Advanced), and
                verifiable accuracy metrics over time.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Trophy size={20} aria-hidden />
              </div>
              <h3 className="feature-title">6. Demonstrate Your Skills</h3>
              <p className="feature-body">
                Earn server-verified achievement badges and downloadable Certificates of Practical
                Proficiency to showcase to colleges and employers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section C: The 5-Stage Learning Cycle (ASSESS -> PERSONALIZE -> PRACTICE -> PROVE -> IMPROVE) */}
      <section id="cycle" ref={cycleRef} className="section-white">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2 className="section-title">The 5-stage continuous learning cycle.</h2>
            <p className="section-subtitle">
              ASSESS → PERSONALIZE → PRACTICE → PROVE → IMPROVE
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
                Evaluate your baseline with server-graded 5-question diagnostics testing core
                syntax, mutability, and formulas.
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
                Generate an adaptive roadmap tailored precisely to the topics and questions you
                missed during evaluation.
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
                Engage in active dialogue with the AI Learning Assistant, read structured lesson notes,
                and solve daily code puzzles.
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
                Demonstrate genuine conceptual ability with rigorous server-side evaluations and
                detailed explanation reviews.
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
                Advance from Beginner to Advanced proficiency, climb academic leaderboards, and
                earn verifiable digital certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: Working Features Showcase */}
      <section id="features" ref={featuresRef} className="section-soft">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">PRODUCT CAPABILITIES</span>
            <h2 className="section-title">Built for authentic technical depth.</h2>
            <p className="section-subtitle">
              Every feature in PragyaX is fully integrated and designed to support self-paced student
              mastery.
            </p>
          </div>

          <div className="features-grid-3x2">
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <BookOpen size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Flexible Subject Selection</h3>
              <p className="feature-body">
                Primary active tracks in Python, Mathematics, Physics, Chemistry, and Biology, plus
                upcoming previews in AI, C++, Java, and DSA.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <FileUp size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Syllabus Upload & Extraction</h3>
              <p className="feature-body">
                Upload your course syllabus (.pdf, .docx, .txt) with automated unit extraction,
                editable topics, and instant roadmap generation.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Milestone size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Manual Topic Entry</h3>
              <p className="feature-body">
                Directly enter any custom concept—such as Python Functions, Calculus Derivatives, or
                Newton's Laws—without requiring a syllabus document.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Compass size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Personalized Roadmaps</h3>
              <p className="feature-body">
                Step-by-step milestone timeline with verified prerequisite gates, learning-gap
                recovery, and objective status tracking.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Target size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Server-Graded Assessments</h3>
              <p className="feature-body">
                5-question diagnostic evaluations where answer keys and explanations are securely
                evaluated server-side, never exposed to clients.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Bot size={20} aria-hidden />
              </div>
              <h3 className="feature-title">AI Learning Chat</h3>
              <p className="feature-body">
                Context-aware learning assistant with syntax-highlighted code blocks, subject-specific
                follow-ups, and persistent discussion history.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Code2 size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Interactive Code Sandbox</h3>
              <p className="feature-body">
                Execute Python snippets, test execution outputs, and inspect multi-subject question
                banks with difficulty and topic filters.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Zap size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Daily Challenges & 1v1 Battles</h3>
              <p className="feature-body">
                Solve daily bite-sized coding puzzles and challenge peers in real-time 45-second live
                knowledge sprints.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <Award size={20} aria-hidden />
              </div>
              <h3 className="feature-title">Verified Badges & Certificates</h3>
              <p className="feature-body">
                Earn credentials for high scores, daily streaks, and download verifiable Certificates
                of Practical Proficiency.
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
            <h2 className="section-title">Deep foundational mastery in core science & computing.</h2>
            <p className="section-subtitle">
              Explore active tracks designed to bridge the gap between classroom theory and practical
              technical competence.
            </p>
          </div>

          <div className="curriculum-showcase-box">
            <div className="curriculum-track-header">
              <div className="track-left">
                <div className="track-badge">5 ACTIVE TRACKS</div>
                <h3 className="track-title">Python, Mathematics, Physics, Chemistry & Biology</h3>
                <p className="track-desc">
                  Every active track contains 5-question objective diagnostics, structured lessons,
                  and AI tutoring support.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => focusAuth("register")}
              >
                Enroll Free & Take Diagnostic
              </Button>
            </div>

            <div className="curriculum-topics-grid">
              <div className="topic-col">
                <span className="topic-num">01</span>
                <h4>Python Programming</h4>
                <p>Default arg mutability, sequence slicing, hash invariance, and LEGB scope.</p>
              </div>
              <div className="topic-col">
                <span className="topic-num">02</span>
                <h4>Mathematics</h4>
                <p>Differential calculus, product/chain rules, matrix determinants, and probability.</p>
              </div>
              <div className="topic-col">
                <span className="topic-num">03</span>
                <h4>Physics</h4>
                <p>Work-energy theorem, kinematics, Coulomb's law, and thermodynamics.</p>
              </div>
              <div className="topic-col">
                <span className="topic-num">04</span>
                <h4>Chemistry & Biology</h4>
                <p>VSEPR hybridization, Le Chatelier shifts, DNA Helicase, and nephron transport.</p>
              </div>
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
              Real feedback from learners using the PragyaX diagnostic loop.
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
                "We recommend PragyaX to students preparing for practical labs. The verified scorecards
                and diagnostic roadmaps make self-paced learning truly measurable."
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
          <h2 className="cta-title">Make your next learning step count.</h2>
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

      {/* Section H: Comprehensive Modern SaaS Footer (PRESERVED & ENHANCED) */}
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
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Mathematics & Calculus</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Physics & Mechanics</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Chemistry Thermodynamics</a></li>
                <li><a href="#curriculum" onClick={(e) => { e.preventDefault(); scrollToSection(curriculumRef); }}>Biology & Genetics</a></li>
              </ul>
            </div>

            {/* Column 4: Platform & Integrity */}
            <div className="footer-col">
              <h4 className="footer-heading">Platform & Trust</h4>
              <ul className="footer-links">
                <li><a href="#account" onClick={(e) => { e.preventDefault(); focusAuth("login"); }}>Student Authentication</a></li>
                <li><a href="#account" onClick={(e) => { e.preventDefault(); focusAuth("register"); }}>Account Registration</a></li>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>Platform Capabilities</a></li>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>PBKDF2 Password Security</a></li>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>Academic Honor Code</a></li>
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
