import { useState } from "react";
import { Bot, CheckCircle2, ChevronRight, Terminal, Trophy } from "lucide-react";

/**
 * ProductPreview: Clean, authentic SaaS product preview
 * Showcases the actual PragyaX experience:
 * 1. Diagnostic assessment question with real Python code.
 * 2. Instant AI Learning Assistant explanation.
 * 3. Live skill scorecard and badge award.
 */
export function ProductPreview() {
  const [activeTab, setActiveTab] = useState<"assessment" | "tutor">("assessment");

  return (
    <div className="product-preview-shell">
      {/* Chrome Window Header */}
      <div className="preview-window-bar">
        <div className="window-dots" aria-hidden="true">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="preview-url-pill">
          <Terminal size={12} className="url-icon" aria-hidden />
          <span>pragyax.edu/python/diagnostic</span>
        </div>
        <div className="preview-status-pill">
          <span className="status-indicator-live" />
          <span>Live Session</span>
        </div>
      </div>

      {/* Preview Tab Navigation */}
      <div className="preview-mode-switch">
        <button
          type="button"
          className={`preview-tab-btn ${activeTab === "assessment" ? "active" : ""}`}
          onClick={() => setActiveTab("assessment")}
        >
          <CheckCircle2 size={14} aria-hidden /> Diagnostic Assessment
        </button>
        <button
          type="button"
          className={`preview-tab-btn ${activeTab === "tutor" ? "active" : ""}`}
          onClick={() => setActiveTab("tutor")}
        >
          <Bot size={14} aria-hidden /> AI Learning Assistant
        </button>
      </div>

      {/* Main Preview Screen */}
      <div className="preview-screen-body">
        {activeTab === "assessment" ? (
          <div className="preview-assessment-view">
            <div className="assessment-meta-row">
              <span className="assessment-badge-track">PYTHON PROGRAMMING</span>
              <span className="assessment-step-count">Question 3 of 5 · Server Evaluated</span>
            </div>

            <p className="assessment-question-text">
              What does the following function call evaluate to in Python?
            </p>

            <div className="preview-code-block">
              <div className="code-header">
                <span className="code-lang">python</span>
                <span className="code-topic">Default Argument Mutability</span>
              </div>
              <pre>
                <code>
                  <span className="token-keyword">def</span> <span className="token-func">collect</span>(item, store=[]):<br />
                  {"    "}store.append(item)<br />
                  {"    "}<span className="token-keyword">return</span> store<br />
                  <br />
                  <span className="token-func">print</span>(collect(1), collect(2))
                </code>
              </pre>
            </div>

            <div className="preview-options-list">
              <div className="preview-option">
                <span className="option-circle">A</span>
                <code>[1] [2]</code>
              </div>
              <div className="preview-option option-correct">
                <span className="option-circle selected">B</span>
                <code>[1] [1, 2]</code>
                <span className="correct-tag">
                  <CheckCircle2 size={13} aria-hidden /> Correct Answer
                </span>
              </div>
              <div className="preview-option">
                <span className="option-circle">C</span>
                <code>TypeError: default argument modified</code>
              </div>
            </div>

            {/* Micro Scorecard Banner */}
            <div className="preview-scorecard-toast">
              <div className="toast-left">
                <Trophy size={16} className="trophy-icon" aria-hidden />
                <div>
                  <strong>Score: 80% (Advanced Proficiency)</strong>
                  <p>LEGB Scope & Mutability verified on server</p>
                </div>
              </div>
              <span className="points-pill">+25 Points</span>
            </div>
          </div>
        ) : (
          <div className="preview-tutor-view">
            <div className="tutor-header-row">
              <div className="tutor-avatar">
                <Bot size={16} aria-hidden />
              </div>
              <div>
                <strong>PragyaX Learning Assistant</strong>
                <p>Adaptive contextual explanations</p>
              </div>
            </div>

            <div className="tutor-dialogue-box">
              <div className="tutor-user-msg">
                <span>Why does `store` remember values between calls?</span>
              </div>
              <div className="tutor-bot-msg">
                <p>
                  In Python, <strong>default parameter expressions are evaluated once</strong> when
                  the function definition is executed, not each time the function is called.
                </p>
                <div className="tutor-code-snippet">
                  <code># Best practice: use None as default sentinel</code><br />
                  <code>def collect(item, store=None):</code><br />
                  <code>{"    "}if store is None: store = []</code>
                </div>
                <p>
                  Because a list is mutable, mutations to `store` persist across subsequent calls
                  sharing that same default object reference.
                </p>
              </div>
            </div>

            <div className="tutor-prompt-suggestions">
              <span className="suggestion-label">Suggested follow-up:</span>
              <button type="button" className="suggestion-chip">
                <span>How does variable shadowing work in nested functions?</span>
                <ChevronRight size={12} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Bottom Bar: Social Proof & Metrics */}
      <div className="preview-footer-metrics">
        <div className="footer-metric-col">
          <span className="metric-num">5</span>
          <span className="metric-lbl">Targeted questions</span>
        </div>
        <div className="metric-divider" />
        <div className="footer-metric-col">
          <span className="metric-num">&lt; 3m</span>
          <span className="metric-lbl">Diagnostic speed</span>
        </div>
        <div className="metric-divider" />
        <div className="footer-metric-col">
          <span className="metric-num">100%</span>
          <span className="metric-lbl">Objective grading</span>
        </div>
      </div>
    </div>
  );
}

export default ProductPreview;
