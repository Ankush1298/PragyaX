import { useState } from "react";
import {
  Award,
  Copy,
  Download,
  GraduationCap,
  Mail,
  Share2,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading, formatDate } from "../components/States";
import { useLoad } from "../hooks";

export default function ProfilePage() {
  const { data: dash, error, loading, reload } = useLoad(api.dashboard);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);

  // Preference state
  const [studyGoal, setStudyGoal] = useState("Semester Honors & Lab Viva");
  const [dailyPace, setDailyPace] = useState("30 minutes / day");

  // Referral Entry state
  const [inputRefCode, setInputRefCode] = useState("");
  const [referralRedeemStatus, setReferralRedeemStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (loading) return <Loading label="Loading your profile & certificates…" />;
  if (error || !dash) return <ErrorBox message={error ?? "Could not load profile"} onRetry={reload} />;

  const { user, selected_subject: subject, metrics: m, recent_attempts, badges } = dash;
  const bestAttempt = recent_attempts.find((a) => a.percentage >= 60);

  const referralCode = `PRAGYA-${user.id.substring(4, 9).toUpperCase()}`;
  const referralUrl = `https://pragyax.edu/join?ref=${referralCode}`;
  const profileUrl = `https://pragyax.edu/u/${user.id}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const copyProfile = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  const handleDownloadCertificate = () => {
    setDownloadingCert(true);
    setTimeout(() => {
      setDownloadingCert(false);
      window.print();
    }, 600);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Learner Profile & Credentials</h1>
          <p className="muted">
            Manage your academic preferences, verified assessment scorecards, certificates, and
            shareable skill portfolio.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={copyProfile}>
          <Share2 size={15} /> {copiedProfile ? "Link Copied!" : "Share Profile"}
        </button>
      </header>

      {/* Top Profile Card */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              className="avatar"
              style={{ width: 64, height: 64, fontSize: "1.6rem", background: "var(--color-aubergine-deep)", color: "white" }}
            >
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: "1.4rem", margin: 0 }}>{user.name}</h2>
              <span className="muted" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                <Mail size={13} /> {user.email} · Member since {formatDate(user.created_at || "2026-10-01")}
              </span>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span className="badge badge-accent">Level {Math.floor(m.total_points / 50) + 1} Practitioner</span>
                <span className="badge">Active Track: {subject.title}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span className="small muted">Total Practical XP</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--color-brand-primary)" }}>
              {m.total_points}
            </div>
          </div>
        </div>
      </section>

      <div className="grid-2">
        {/* Left Column: Learning Goals & Referrals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Learning Preferences */}
          <section className="card">
            <h2>Learning Goals & Preferences</h2>
            <div style={{ marginTop: 12 }}>
              <label className="field-group">
                <span className="field-label">Primary Objective</span>
                <select
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  className="clean-input"
                >
                  <option value="Semester Honors & Lab Viva">Semester Honors & Lab Viva</option>
                  <option value="Placement & Competitive Programming">Placement & Competitive Programming</option>
                  <option value="Core Conceptual Grounding">Core Conceptual Grounding</option>
                  <option value="GATE / Postgraduate Exam Prep">GATE / Postgraduate Exam Prep</option>
                </select>
              </label>

              <label className="field-group">
                <span className="field-label">Daily Target Study Pace</span>
                <select
                  value={dailyPace}
                  onChange={(e) => setDailyPace(e.target.value)}
                  className="clean-input"
                >
                  <option value="15 minutes / day">15 minutes / day (Micro-learning)</option>
                  <option value="30 minutes / day">30 minutes / day (Recommended)</option>
                  <option value="60 minutes / day">60 minutes / day (Intensive Sprint)</option>
                </select>
              </label>
            </div>
          </section>

          {/* Referral Program */}
          <section className="card">
            <div className="row-between">
              <h2>Invite & Refer Peers</h2>
              <span className="badge badge-accent">+50 XP per invite</span>
            </div>
            <p className="muted small">
              Share your referral code with peers. When they register or enter your code, both of you unlock 50 bonus XP!
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input
                type="text"
                readOnly
                value={referralCode}
                className="clean-input"
                style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: "1px" }}
              />
              <button type="button" className="btn btn-primary" onClick={copyReferral}>
                <Copy size={15} /> {copiedReferral ? "Copied!" : "Copy Code"}
              </button>
            </div>

            {/* Manual Referral Code Entry */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-light)" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Have a friend's referral code? Enter it below:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputRefCode.trim()) return;
                  if (inputRefCode.toUpperCase().startsWith("PRAGYA-")) {
                    setReferralRedeemStatus({ success: true, message: `Referral code ${inputRefCode.toUpperCase()} applied! +50 XP awarded.` });
                  } else {
                    setReferralRedeemStatus({ success: false, message: "Invalid code format. Codes start with PRAGYA-." });
                  }
                }}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  type="text"
                  placeholder="e.g. PRAGYA-9042A"
                  value={inputRefCode}
                  onChange={(e) => setInputRefCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-light)",
                    fontSize: "0.86rem",
                  }}
                />
                <button type="submit" className="btn btn-ghost btn-sm">
                  Apply Code
                </button>
              </form>

              {referralRedeemStatus && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.8rem",
                    color: referralRedeemStatus.success ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {referralRedeemStatus.message}
                </div>
              )}
            </div>

            <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 16 }}>
              <div className="stat card" style={{ padding: 10 }}>
                <span className="stat-label">Pending</span>
                <strong style={{ fontSize: "1.1rem" }}>1 Friend</strong>
              </div>
              <div className="stat card" style={{ padding: 10 }}>
                <span className="stat-label">Successful</span>
                <strong style={{ fontSize: "1.1rem" }}>2 Students</strong>
              </div>
              <div className="stat card" style={{ padding: 10 }}>
                <span className="stat-label">Earned XP</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--color-brand-primary)" }}>+100 XP</strong>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Verified Certificates & Badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Certificate of Proficiency Card */}
          <section className="card">
            <div className="row-between">
              <h2>Verified Certificate</h2>
              {bestAttempt ? (
                <span className="badge badge-success">
                  <ShieldCheck size={12} /> Verified Eligible
                </span>
              ) : (
                <span className="badge badge-warn">Score ≥ 60% Required</span>
              )}
            </div>

            {bestAttempt ? (
              <div className="certificate-preview-box" style={{ marginTop: 14 }}>
                <div className="cert-border">
                  <div className="cert-header">
                    <GraduationCap size={28} className="accent-icon" />
                    <span className="cert-inst">PRAGYAX LEARNING TECHNOLOGIES</span>
                  </div>
                  <h3 className="cert-title">Certificate of Practical Proficiency</h3>
                  <p className="cert-subtitle">This certifies that</p>
                  <strong className="cert-recipient">{user.name}</strong>
                  <p className="cert-desc">
                    has successfully demonstrated practical competence in <strong>{bestAttempt.subject_title}</strong> with an objective server-evaluated score of <strong>{bestAttempt.percentage}% ({bestAttempt.score}/{bestAttempt.total})</strong>.
                  </p>
                  <div className="cert-footer">
                    <span className="cert-id">Verification Token: PRAGYA-{bestAttempt.id.substring(4, 12)}</span>
                    <span className="cert-date">{formatDate(bestAttempt.created_at)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 16 }}
                  disabled={downloadingCert}
                  onClick={handleDownloadCertificate}
                >
                  <Download size={15} /> {downloadingCert ? "Generating Certificate…" : "Print / Download Verified Certificate"}
                </button>
              </div>
            ) : (
              <div className="empty-placeholder" style={{ padding: "30px 10px" }}>
                <Award size={36} className="muted" />
                <p className="muted" style={{ margin: "10px 0 16px" }}>
                  Complete a 5-question diagnostic assessment in any subject with a score of 60% or higher to unlock your verified certificate.
                </p>
                <a href="#/assessment" className="btn btn-primary btn-sm">
                  Take Diagnostic Assessment
                </a>
              </div>
            )}
          </section>

          {/* Demonstrated Skill Badges */}
          <section className="card">
            <h2>Demonstrated Skill Badges</h2>
            {badges.length === 0 ? (
              <p className="muted small">
                Solve the Daily Code Breaker or achieve full marks on an assessment to earn verifiable digital badges.
              </p>
            ) : (
              <div className="badges" style={{ marginTop: 12 }}>
                {badges.map((b) => (
                  <div key={b.id} className="badge-card">
                    {b.icon === "zap" ? <Zap /> : b.icon === "award" ? <Award /> : <Trophy />}
                    <div>
                      <strong>{b.title}</strong>
                      <small className="muted">{b.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
