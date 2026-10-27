import { useState } from "react";
import {
  Building,
  Calendar,
  CheckCircle2,
  Flame,
  Trophy,
} from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/States";
import { useLoad } from "../hooks";

interface LeaderboardUser {
  rank: number;
  name: string;
  email: string;
  institution: string;
  points: number;
  accuracy: number;
  streak: number;
  isCurrentUser?: boolean;
}

const GLOBAL_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: "Aarav Sharma", email: "aarav@iitd.ac.in", institution: "IIT Delhi", points: 840, accuracy: 96, streak: 14 },
  { rank: 2, name: "Sneha Reddy", email: "sneha@nitw.ac.in", institution: "NIT Warangal", points: 790, accuracy: 92, streak: 11 },
  { rank: 3, name: "Devansh Mehta", email: "devansh@bits.edu", institution: "BITS Pilani", points: 720, accuracy: 90, streak: 9 },
  { rank: 4, name: "Pooja Iyer", email: "pooja@iitb.ac.in", institution: "IIT Bombay", points: 680, accuracy: 88, streak: 7 },
  { rank: 5, name: "Kunal Verma", email: "kunal@iiit.ac.in", institution: "IIIT Hyderabad", points: 650, accuracy: 86, streak: 6 },
];

interface Competition {
  id: string;
  title: string;
  organizer: string;
  type: "college" | "company";
  badge: string;
  deadline: string;
  participants: number;
  reward: string;
  description: string;
  rules: string[];
}

const COMPETITIONS: Competition[] = [
  {
    id: "comp_1",
    title: "Inter-College Python & Algorithms Invitational 2026",
    organizer: "PragyaX Academic Network",
    type: "college",
    badge: "Official College Cup",
    deadline: "November 15, 2026",
    participants: 1420,
    reward: "₹50,000 Scholar Grant + Gold Verified Certificate",
    description: "Multi-round diagnostic coding competition testing scope, algorithmic efficiency, and memory structures.",
    rules: [
      "Open to all enrolled undergraduate students",
      "Individual submission; strictly server-evaluated",
      "Negative marking for repeated incorrect submissions",
    ],
  },
  {
    id: "comp_2",
    title: "National STEM Diagnostic Sprint (Physics & Calculus)",
    organizer: "National Science Foundation Partner",
    type: "college",
    badge: "STEM Olympiad",
    deadline: "November 28, 2026",
    participants: 890,
    reward: "National Merit Fellowship Recommendation",
    description: "Rigorous 20-problem diagnostic assessment across classical mechanics, differential calculus, and thermodynamics.",
    rules: [
      "Timed 90-minute evaluation session",
      "Calculators permitted for numeric evaluations",
      "Live proctored environment",
    ],
  },
  {
    id: "comp_3",
    title: "FinTech Data Systems & Python Challenge",
    organizer: "Apex Quant Technologies",
    type: "company",
    badge: "Industry Sponsored",
    deadline: "December 5, 2026",
    participants: 610,
    reward: "Direct Summer 2027 SWE Internship Interview",
    description: "Real-world financial data transformation puzzles utilizing generators, hashing invariants, and sequence slicing.",
    rules: [
      "Final year and pre-final year students eligible",
      "Code quality and benchmark execution time graded",
      "NDA required for corporate datasets",
    ],
  },
];

export default function LeaderboardPage() {
  const { data: dash, error, loading, reload } = useLoad(api.dashboard);
  const [activeTab, setActiveTab] = useState<"global" | "competitions">("global");
  const [registeredComps, setRegisteredComps] = useState<Record<string, boolean>>({});

  if (loading) return <Loading label="Loading leaderboards & competitions…" />;
  if (error || !dash) return <ErrorBox message={error ?? "Could not load data"} onRetry={reload} />;

  const currentUserPoints = dash.metrics.total_points;
  const currentUserName = dash.user.name;

  // Insert current user into leaderboard dynamically
  const userRank = 6;
  const fullLeaderboard: LeaderboardUser[] = [
    ...GLOBAL_LEADERBOARD,
    {
      rank: userRank,
      name: `${currentUserName} (You)`,
      email: dash.user.email,
      institution: "Your Campus",
      points: currentUserPoints,
      accuracy: dash.metrics.average_percentage || 80,
      streak: 3,
      isCurrentUser: true,
    },
  ];

  const handleRegister = (compId: string) => {
    setRegisteredComps((prev) => ({ ...prev, [compId]: true }));
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <Trophy size={13} aria-hidden />
            <span>Academic Excellence & Competition</span>
          </div>
          <h1>Leaderboards & Challenges</h1>
          <p className="muted">
            Compete on the global academic leaderboard, track subject accuracy, and participate in
            college-sponsored hackathons.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="clean-tabs" style={{ marginBottom: 24, maxWidth: 500 }}>
        <button
          type="button"
          className={`tab ${activeTab === "global" ? "active" : ""}`}
          onClick={() => setActiveTab("global")}
        >
          <Trophy size={16} /> Global Student Rankings
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "competitions" ? "active" : ""}`}
          onClick={() => setActiveTab("competitions")}
        >
          <Building size={16} /> College & Industry Challenges
        </button>
      </div>

      {activeTab === "global" ? (
        <div>
          {/* Top 3 Podium Cards */}
          <div className="podium-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div className="card text-center" style={{ borderTop: "3px solid #94a3b8" }}>
              <span className="badge badge-subtle">🥈 Rank 2</span>
              <h3 style={{ marginTop: 8 }}>{GLOBAL_LEADERBOARD[1].name}</h3>
              <p className="small muted">{GLOBAL_LEADERBOARD[1].institution}</p>
              <strong style={{ fontSize: "1.3rem", color: "var(--color-brand-primary)" }}>
                {GLOBAL_LEADERBOARD[1].points} pts
              </strong>
              <div className="small muted">{GLOBAL_LEADERBOARD[1].accuracy}% Accuracy</div>
            </div>

            <div className="card text-center" style={{ borderTop: "3px solid #f59e0b", transform: "translateY(-6px)" }}>
              <span className="badge badge-accent">👑 Champion · Rank 1</span>
              <h3 style={{ marginTop: 8 }}>{GLOBAL_LEADERBOARD[0].name}</h3>
              <p className="small muted">{GLOBAL_LEADERBOARD[0].institution}</p>
              <strong style={{ fontSize: "1.5rem", color: "var(--color-brand-primary)" }}>
                {GLOBAL_LEADERBOARD[0].points} pts
              </strong>
              <div className="small muted">{GLOBAL_LEADERBOARD[0].accuracy}% Accuracy · {GLOBAL_LEADERBOARD[0].streak}d Streak</div>
            </div>

            <div className="card text-center" style={{ borderTop: "3px solid #d97706" }}>
              <span className="badge badge-subtle">🥉 Rank 3</span>
              <h3 style={{ marginTop: 8 }}>{GLOBAL_LEADERBOARD[2].name}</h3>
              <p className="small muted">{GLOBAL_LEADERBOARD[2].institution}</p>
              <strong style={{ fontSize: "1.3rem", color: "var(--color-brand-primary)" }}>
                {GLOBAL_LEADERBOARD[2].points} pts
              </strong>
              <div className="small muted">{GLOBAL_LEADERBOARD[2].accuracy}% Accuracy</div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <section className="card">
            <h2>All Ranked Scholars</h2>
            <p className="muted small">
              Points are awarded for verified assessment accuracy, Daily Code Breakers, and live battles.
            </p>

            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>Learner</th>
                  <th>Institution</th>
                  <th>Points (XP)</th>
                  <th>Accuracy</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {fullLeaderboard.map((u) => (
                  <tr
                    key={u.rank}
                    style={{
                      backgroundColor: u.isCurrentUser ? "var(--color-slate-50)" : undefined,
                      fontWeight: u.isCurrentUser ? 700 : undefined,
                    }}
                  >
                    <td>
                      {u.rank === 1 ? "🥇 #1" : u.rank === 2 ? "🥈 #2" : u.rank === 3 ? "🥉 #3" : `#${u.rank}`}
                    </td>
                    <td>
                      <div>
                        <span>{u.name}</span>
                        {u.isCurrentUser && (
                          <span className="badge badge-accent" style={{ marginLeft: 8, fontSize: "0.7rem" }}>
                            Current User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="muted">{u.institution}</td>
                    <td>
                      <strong>{u.points} XP</strong>
                    </td>
                    <td>{u.accuracy}%</td>
                    <td>
                      <span className="row-between" style={{ justifyContent: "flex-start", gap: 4 }}>
                        <Flame size={14} className="accent-icon" /> {u.streak} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        /* Competitions Tab */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {COMPETITIONS.map((c) => {
            const isRegistered = registeredComps[c.id];

            return (
              <article key={c.id} className="card">
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${c.type === "company" ? "badge-accent" : ""}`}>
                      {c.badge}
                    </span>
                    <span className="small muted">Organized by {c.organizer}</span>
                  </div>
                  <span className="small muted">
                    <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    Deadline: {c.deadline}
                  </span>
                </div>

                <h2 style={{ fontSize: "1.25rem", margin: "6px 0" }}>{c.title}</h2>
                <p>{c.description}</p>

                <div className="stats" style={{ gridTemplateColumns: "repeat(2, 1fr)", margin: "14px 0" }}>
                  <div className="stat card" style={{ padding: 12 }}>
                    <span className="stat-label">Prize / Career Outcome</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--color-brand-primary)" }}>
                      {c.reward}
                    </strong>
                  </div>
                  <div className="stat card" style={{ padding: 12 }}>
                    <span className="stat-label">Registered Participants</span>
                    <strong style={{ fontSize: "1.05rem" }}>
                      {c.participants + (isRegistered ? 1 : 0)} Students
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <strong>Eligibility & Participation Rules:</strong>
                  <ul className="checklist" style={{ marginTop: 6 }}>
                    {c.rules.map((r, idx) => (
                      <li key={idx} className="done" style={{ padding: "4px 0" }}>
                        <span className="check">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="row-between" style={{ borderTop: "1px solid var(--border-light)", paddingTop: 14 }}>
                  <span className="small muted">
                    Honor code applies. Multiple accounts or plagiarism result in automatic disqualification.
                  </span>

                  {isRegistered ? (
                    <div className="badge badge-success" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                      <CheckCircle2 size={16} /> Registered · Test link will be sent to your email
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRegister(c.id)}
                    >
                      Register Free for Challenge
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
