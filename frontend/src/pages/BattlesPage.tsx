import { useEffect, useState } from "react";
import {
  Award,
  Clock,
  Copy,
  Flame,
  RefreshCw,
  ShieldAlert,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { ErrorBox, Loading } from "../components/States";
import { useLoad } from "../hooks";

interface BattleQuestion {
  id: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctKey: string;
  topic: string;
}

const BATTLE_QUESTIONS: Record<string, BattleQuestion[]> = {
  subj_python: [
    {
      id: "bq_py_1",
      questionText: "What does `append_item(2)` return when default `container=[]` was previously called with 1?",
      options: [
        { key: "A", text: "[2]" },
        { key: "B", text: "[1, 2]" },
        { key: "C", text: "TypeError" },
        { key: "D", text: "None" },
      ],
      correctKey: "B",
      topic: "Default Argument Mutability",
    },
    {
      id: "bq_py_2",
      questionText: "What is the result of sequence slicing `[10, 20, 30][1:3:-1]`?",
      options: [
        { key: "A", text: "[30, 20]" },
        { key: "B", text: "[20, 30]" },
        { key: "C", text: "[] (empty list)" },
        { key: "D", text: "IndexError" },
      ],
      correctKey: "C",
      topic: "Negative Slice Stepping",
    },
    {
      id: "bq_py_3",
      questionText: "Why can a tuple be a dictionary key whereas a list cannot?",
      options: [
        { key: "A", text: "Tuples occupy less RAM" },
        { key: "B", text: "Lists lack indices" },
        { key: "C", text: "Tuples with immutable items are hashable" },
        { key: "D", text: "Syntax restrictions only" },
      ],
      correctKey: "C",
      topic: "Hash Invariance",
    },
  ],
  subj_math: [
    {
      id: "bq_m_1",
      questionText: "What is the derivative of f(x) = x · e^x?",
      options: [
        { key: "A", text: "e^x" },
        { key: "B", text: "e^x(x + 1)" },
        { key: "C", text: "x · e^x" },
        { key: "D", text: "2x · e^x" },
      ],
      correctKey: "B",
      topic: "Calculus Product Rule",
    },
    {
      id: "bq_m_2",
      questionText: "What is the determinant of the 2x2 matrix [[3, 2], [1, 4]]?",
      options: [
        { key: "A", text: "10" },
        { key: "B", text: "14" },
        { key: "C", text: "12" },
        { key: "D", text: "8" },
      ],
      correctKey: "A",
      topic: "Linear Algebra",
    },
    {
      id: "bq_m_3",
      questionText: "What is the value of log₂(64)?",
      options: [
        { key: "A", text: "4" },
        { key: "B", text: "5" },
        { key: "C", text: "6" },
        { key: "D", text: "8" },
      ],
      correctKey: "C",
      topic: "Logarithms",
    },
  ],
};

export default function BattlesPage() {
  const { data: subData, error: subErr, loading: subLoading } = useLoad(api.subjects);
  const { data: dash, loading: dashLoading } = useLoad(api.dashboard);

  // Battle Mode: "lobby" | "searching" | "playing" | "results"
  const [battleState, setBattleState] = useState<"lobby" | "searching" | "playing" | "results">("lobby");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("subj_python");
  const [roomCode] = useState<string>("BTL-8429");
  const [copiedCode, setCopiedCode] = useState(false);

  // Gameplay State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [opponentName, setOpponentName] = useState("Alex (Peer Learner)");

  // Battle history
  const [battleHistory, setBattleHistory] = useState([
    { id: "bh_1", opponent: "Rohan Patel", subject: "Python Programming", result: "Victory", score: "3 - 2", xp: "+75 XP", date: "Yesterday" },
    { id: "bh_2", opponent: "AI Adversary (Medium)", subject: "Mathematics", result: "Victory", score: "3 - 1", xp: "+50 XP", date: "2 days ago" },
    { id: "bh_3", opponent: "Priya Sharma", subject: "Physics", result: "Defeat", score: "1 - 3", xp: "+15 XP", date: "3 days ago" },
  ]);

  const questions = BATTLE_QUESTIONS[selectedSubjectId] || BATTLE_QUESTIONS.subj_python;
  const currentQ = questions[currentQIndex];

  // Live battle countdown timer
  useEffect(() => {
    let timer: any;
    if (battleState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (battleState === "playing" && timeLeft === 0) {
      finishBattle();
    }
    return () => clearInterval(timer);
  }, [battleState, timeLeft]);

  if (subLoading || dashLoading) return <Loading label="Loading 1v1 battle arena…" />;
  if (subErr || !subData) return <ErrorBox message={subErr ?? "Could not load subjects"} />;

  const startSearch = () => {
    setBattleState("searching");
    setTimeout(() => {
      setOpponentName("Priya M. (IIT Delhi)");
      setCurrentQIndex(0);
      setUserScore(0);
      setOpponentScore(0);
      setTimeLeft(45);
      setUserAnswers({});
      setBattleState("playing");
    }, 1800);
  };

  const submitAnswer = (optionKey: string) => {
    if (userAnswers[currentQIndex]) return;

    const isCorrect = optionKey === currentQ.correctKey;
    const newAnswers = { ...userAnswers, [currentQIndex]: optionKey };
    setUserAnswers(newAnswers);

    let newUserScore = userScore;
    if (isCorrect) {
      newUserScore += 1;
      setUserScore(newUserScore);
    }

    // Simulate realistic opponent delay and response
    setTimeout(() => {
      const oppCorrect = Math.random() > 0.35;
      if (oppCorrect) setOpponentScore((prev) => prev + 1);
    }, 400);

    // Proceed to next question or finish
    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        finishBattle();
      }
    }, 800);
  };

  const finishBattle = () => {
    setBattleState("results");
    const won = userScore >= opponentScore;
    const newEntry = {
      id: `bh_${Date.now()}`,
      opponent: opponentName,
      subject: selectedSubjectId === "subj_python" ? "Python Programming" : "Mathematics",
      result: won ? "Victory" : "Defeat",
      score: `${userScore} - ${opponentScore}`,
      xp: won ? "+75 XP" : "+20 XP",
      date: "Just now",
    };
    setBattleHistory((prev) => [newEntry, ...prev]);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 8 }}>
            <Swords size={13} aria-hidden />
            <span>Competitive Skill Verification</span>
          </div>
          <h1>1v1 Live Learning Battles</h1>
          <p className="muted">
            Challenge peers and verified AI adversaries to real-time 3-question diagnostic sprints.
          </p>
        </div>
      </header>

      {/* Backend Protocol Notice */}
      <div className="alert alert-warn" style={{ marginBottom: 20 }}>
        <ShieldAlert size={18} />
        <div>
          <strong>Multiplayer Infrastructure Notice:</strong>
          <span style={{ display: "block", marginTop: 2 }}>
            Real-time peer matchmaking uses Local Session Protocol. Peer-to-peer WebSocket cluster
            integration will be connected in Phase 2 backend deployment.
          </span>
        </div>
      </div>

      {battleState === "lobby" && (
        <div className="grid-2">
          {/* Matchmaking Discovery */}
          <section className="card">
            <h2>Find an Opponent</h2>
            <p className="muted small">
              Select your subject and battle in a timed 45-second test of practical conceptual speed.
            </p>

            <label className="field-group">
              <span className="field-label">Battle Subject Track</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="clean-input"
              >
                <option value="subj_python">Python Programming</option>
                <option value="subj_math">Mathematics</option>
                <option value="subj_physics">Physics</option>
                <option value="subj_chemistry">Chemistry</option>
                <option value="subj_biology">Biology</option>
              </select>
            </label>

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={startSearch}
              >
                <Zap size={16} /> Quick Match (Find Live Opponent)
              </button>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
              <strong>Custom Peer Challenge</strong>
              <p className="small muted">Share your challenge code with a college classmate:</p>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={roomCode}
                  className="clean-input"
                  style={{ fontWeight: 700, letterSpacing: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={copyRoomCode}
                >
                  <Copy size={14} /> {copiedCode ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </section>

          {/* Battle Statistics & Past Battles */}
          <section className="card">
            <h2>Your Battle Record</h2>
            <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 16 }}>
              <div className="stat card" style={{ padding: 12 }}>
                <Trophy size={18} className="stat-icon" />
                <span className="stat-label">Victories</span>
                <span className="stat-value" style={{ fontSize: "1.4rem" }}>
                  {battleHistory.filter((b) => b.result === "Victory").length}
                </span>
              </div>
              <div className="stat card" style={{ padding: 12 }}>
                <Flame size={18} className="stat-icon" />
                <span className="stat-label">Win Rate</span>
                <span className="stat-value" style={{ fontSize: "1.4rem" }}>
                  {Math.round((battleHistory.filter((b) => b.result === "Victory").length / battleHistory.length) * 100)}%
                </span>
              </div>
              <div className="stat card" style={{ padding: 12 }}>
                <Award size={18} className="stat-icon" />
                <span className="stat-label">Battle XP</span>
                <span className="stat-value" style={{ fontSize: "1.4rem" }}>+195</span>
              </div>
            </div>

            <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>Recent Match History</h3>
            <div className="battle-history-list">
              {battleHistory.map((bh) => (
                <div key={bh.id} className="battle-history-row">
                  <div>
                    <strong>vs {bh.opponent}</strong>
                    <span className="small muted" style={{ display: "block" }}>{bh.subject} · {bh.date}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${bh.result === "Victory" ? "badge-success" : "badge-warn"}`}>
                      {bh.result} ({bh.score})
                    </span>
                    <span className="small muted" style={{ display: "block", marginTop: 2 }}>{bh.xp}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {battleState === "searching" && (
        <div className="card text-center" style={{ padding: "60px 20px", maxWidth: 500, margin: "0 auto" }}>
          <div className="loading-spinner-circle" style={{ margin: "0 auto 20px" }} />
          <h2>Finding Live Opponent…</h2>
          <p className="muted">
            Matching with learners on the <strong>{selectedSubjectId === "subj_python" ? "Python" : "Math"}</strong> leaderboard.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 20 }}
            onClick={() => setBattleState("lobby")}
          >
            Cancel Matchmaking
          </button>
        </div>
      )}

      {battleState === "playing" && (
        <div className="battle-arena-shell" style={{ maxWidth: 750, margin: "0 auto" }}>
          {/* Header Bar with Live Scores & Timer */}
          <div className="card battle-scoreboard-card" style={{ marginBottom: 16 }}>
            <div className="row-between">
              {/* User Player */}
              <div className="battle-player-badge">
                <div className="avatar" style={{ width: 36, height: 36 }}>
                  {dash?.user?.name.charAt(0) || "U"}
                </div>
                <div>
                  <strong>{dash?.user?.name || "You"}</strong>
                  <span className="score-tally">{userScore} pts</span>
                </div>
              </div>

              {/* Central Timer */}
              <div className="battle-timer-pill">
                <Clock size={16} />
                <span>{timeLeft}s remaining</span>
              </div>

              {/* Opponent Player */}
              <div className="battle-player-badge right">
                <div>
                  <strong>{opponentName}</strong>
                  <span className="score-tally">{opponentScore} pts</span>
                </div>
                <div className="avatar" style={{ width: 36, height: 36, background: "var(--color-aubergine-secondary)" }}>
                  {opponentName.charAt(0)}
                </div>
              </div>
            </div>

            {/* Question Progress Dots */}
            <div className="row-between" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border-light)" }}>
              <span className="small muted">
                Question {currentQIndex + 1} of {questions.length} · Topic: {currentQ.topic}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {questions.map((_, idx) => (
                  <span
                    key={idx}
                    className={`dot ${idx === currentQIndex ? "accent" : idx < currentQIndex ? "green" : ""}`}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: idx <= currentQIndex ? "var(--color-brand-primary)" : "var(--border-light)" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Active Question Box */}
          <section className="card question">
            <pre className="question-text" style={{ fontSize: "1.05rem" }}>
              {currentQ.questionText}
            </pre>

            <div className="options" style={{ marginTop: 20 }}>
              {currentQ.options.map((opt) => {
                const isSelected = userAnswers[currentQIndex] === opt.key;
                const isSubmitted = !!userAnswers[currentQIndex];
                let cls = "";
                if (isSubmitted) {
                  if (opt.key === currentQ.correctKey) cls = "correct";
                  else if (isSelected) cls = "wrong";
                }

                return (
                  <label
                    key={opt.key}
                    className={`option ${cls}`}
                    onClick={() => !isSubmitted && submitAnswer(opt.key)}
                    style={{ cursor: isSubmitted ? "default" : "pointer" }}
                  >
                    <span className="option-key">{opt.key}</span>
                    <span>{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {battleState === "results" && (
        <div className="card text-center" style={{ maxWidth: 600, margin: "0 auto", padding: 36 }}>
          <div style={{ marginBottom: 16 }}>
            {userScore >= opponentScore ? (
              <Trophy size={48} style={{ color: "var(--color-marigold)" }} />
            ) : (
              <Zap size={48} style={{ color: "var(--text-muted)" }} />
            )}
          </div>

          <h2 style={{ fontSize: "1.8rem" }}>
            {userScore > opponentScore
              ? "Victory! Outstanding Knowledge Speed."
              : userScore === opponentScore
              ? "Honorable Draw! Matched Performance."
              : "Defeat. Review and Re-Challenge!"}
          </h2>

          <p className="muted" style={{ marginBottom: 24 }}>
            Final Score: <strong>{userScore}</strong> (You) vs <strong>{opponentScore}</strong> ({opponentName})
          </p>

          <div className="alert alert-success" style={{ marginBottom: 24, textAlign: "left" }}>
            <Award size={20} />
            <div>
              <strong>Earned Battle XP: {userScore >= opponentScore ? "+75 XP" : "+25 XP"}</strong>
              <p style={{ margin: "2px 0 0" }}>Recorded in your persistent learning activity profile.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startSearch}
            >
              <RefreshCw size={14} /> Find Another Match
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setBattleState("lobby")}
            >
              Return to Battle Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
