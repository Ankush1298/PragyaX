import { useState } from "react";
import {
  Check,
  Flame,
  Gift,
  History,
  Lock,
  Medal,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useLoad } from "../hooks";
import { api } from "../api/client";
import { Loading } from "../components/States";

interface RewardItem {
  id: string;
  title: string;
  description: string;
  costXP: number;
  category: "perk" | "credential" | "swag";
  icon: string;
  unlocked: boolean;
}

const REWARD_STORE: RewardItem[] = [
  {
    id: "rw-1",
    title: "1v1 Battle Shield (Streak Freeze)",
    description: "Protects your daily learning streak from breaking if you miss a study session.",
    costXP: 250,
    category: "perk",
    icon: "🛡️",
    unlocked: true,
  },
  {
    id: "rw-2",
    title: "Verified Certificate of Practical Proficiency",
    description: "Official cryptographically signed PDF certificate with public token verification.",
    costXP: 500,
    category: "credential",
    icon: "📜",
    unlocked: false,
  },
  {
    id: "rw-3",
    title: "Priority AI Mentor Access (Gemma 3 Tier)",
    description: "Unlock deep multi-step explanations, code refactoring reviews, and instant hints.",
    costXP: 750,
    category: "perk",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "rw-4",
    title: "Official PragyaX Engineering Hoodie & Swag",
    description: "Delivered to your campus or mailing address upon completing 3 extreme capstones.",
    costXP: 2500,
    category: "swag",
    icon: "👕",
    unlocked: false,
  },
];

const LEVEL_TIERS = [
  { level: 1, title: "Novice", minXP: 0, maxXP: 200 },
  { level: 2, title: "Apprentice", minXP: 200, maxXP: 500 },
  { level: 3, title: "Practitioner", minXP: 500, maxXP: 1000 },
  { level: 4, title: "Scholar", minXP: 1000, maxXP: 1800 },
  { level: 5, title: "Specialist", minXP: 1800, maxXP: 3000 },
  { level: 6, title: "Master", minXP: 3000, maxXP: 5000 },
  { level: 7, title: "Grandmaster", minXP: 5000, maxXP: 10000 },
];

export default function RewardsPage() {
  const { data: userStats, loading: statsLoading } = useLoad(api.me);

  // Balance state derived from user or default
  const [currentXP, setCurrentXP] = useState(1320);
  const [streakDays] = useState(6);
  const [redeemedIds, setRedeemedIds] = useState<string[]>(["rw-1"]);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"store" | "levels" | "history">("store");

  const [historyLog, setHistoryLog] = useState([
    { id: "h1", event: "Completed Assessment: Python Programming", xp: "+120 XP", date: "Today" },
    { id: "h2", event: "Solved Daily Challenge (Hash Maps)", xp: "+30 XP", date: "Today" },
    { id: "h3", event: "Redeemed: 1v1 Battle Shield (Streak Freeze)", xp: "-250 XP", date: "Yesterday" },
    { id: "h4", event: "Won 1v1 Battle against CodeMaster", xp: "+50 XP", date: "2 days ago" },
    { id: "h5", event: "7-Day Consistent Streak Bonus", xp: "+100 XP", date: "3 days ago" },
  ]);

  if (statsLoading && !userStats) return <Loading label="Loading gamification balance…" />;

  // Calculate current level
  const currentTier =
    LEVEL_TIERS.find((t) => currentXP >= t.minXP && currentXP < t.maxXP) ||
    LEVEL_TIERS[LEVEL_TIERS.length - 1];
  const nextTier = LEVEL_TIERS.find((t) => t.level === currentTier.level + 1);
  const xpInTier = currentXP - currentTier.minXP;
  const xpNeeded = (nextTier ? nextTier.minXP : currentTier.maxXP) - currentTier.minXP;
  const progressPercent = Math.min(100, Math.round((xpInTier / xpNeeded) * 100));

  const handleRedeem = (item: RewardItem) => {
    if (currentXP < item.costXP) return;
    if (redeemedIds.includes(item.id)) return;

    setCurrentXP((prev) => prev - item.costXP);
    setRedeemedIds((prev) => [...prev, item.id]);
    setRedeemSuccess(`Successfully unlocked "${item.title}"!`);

    setHistoryLog((prev) => [
      {
        id: `h-${Date.now()}`,
        event: `Redeemed: ${item.title}`,
        xp: `-${item.costXP} XP`,
        date: "Just now",
      },
      ...prev,
    ]);

    setTimeout(() => setRedeemSuccess(null), 4000);
  };

  return (
    <div className="page rewards-page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <Gift size={13} aria-hidden />
            <span>Gamification & Recognition</span>
          </div>
          <h1>Rewards & Level Progression</h1>
          <p className="muted">
            Earn Experience Points (XP) through verified assessments, daily challenges, and engineering projects. Redeem your XP for valuable credentials and platform perks.
          </p>
        </div>

        {/* Balance Badge Cards */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius)",
              background: "var(--color-ice-silver)",
              border: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Zap size={22} color="var(--color-indigo)" />
            <div>
              <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-charcoal-muted)" }}>
                Available Balance
              </div>
              <strong style={{ fontSize: "1.2rem", color: "var(--color-indigo)" }}>
                {currentXP.toLocaleString()} XP
              </strong>
            </div>
          </div>

          <div
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius)",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Flame size={22} color="#ea580c" />
            <div>
              <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 700, color: "#9a3412" }}>
                Active Streak
              </div>
              <strong style={{ fontSize: "1.2rem", color: "#c2410c" }}>
                {streakDays} Days
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* Level Progression Progress Bar Card */}
      <section
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={20} color="var(--color-indigo)" />
              <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 800 }}>
                Level {currentTier.level} — {currentTier.title}
              </h2>
            </div>
            <p className="muted" style={{ fontSize: "0.86rem", margin: "4px 0 0 0" }}>
              {nextTier
                ? `${nextTier.minXP - currentXP} XP required to advance to Level ${nextTier.level} (${nextTier.title})`
                : "Maximum Tier Reached: Grandmaster Practitioner"}
            </p>
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-indigo)" }}>
            {progressPercent}% Complete
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div
          style={{
            height: 12,
            background: "#e2e8f0",
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, var(--color-indigo) 0%, #818cf8 100%)",
              borderRadius: 6,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Milestone Steps */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
          {LEVEL_TIERS.map((tier) => {
            const isPassed = currentXP >= tier.minXP;
            const isCurrent = tier.level === currentTier.level;
            return (
              <div
                key={tier.level}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: isPassed ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: isCurrent ? "var(--color-indigo)" : isPassed ? "#16a34a" : "#cbd5e1",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    marginBottom: 4,
                  }}
                >
                  {isPassed ? <Check size={12} /> : tier.level}
                </div>
                <span style={{ fontWeight: isCurrent ? 700 : 500 }}>{tier.title}</span>
                <span className="muted" style={{ fontSize: "0.72rem" }}>
                  {tier.minXP} XP
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabs: Rewards Store | Level Breakdown | History */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-light)", paddingBottom: 10, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${activeTab === "store" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("store")}
        >
          <Gift size={15} /> Rewards Store
        </button>
        <button
          className={`btn btn-sm ${activeTab === "levels" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("levels")}
        >
          <Trophy size={15} /> All Level Tiers
        </button>
        <button
          className={`btn btn-sm ${activeTab === "history" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={15} /> XP Transaction History
        </button>
      </div>

      {redeemSuccess && (
        <div
          style={{
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--radius)",
            color: "#166534",
            fontSize: "0.9rem",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={16} /> {redeemSuccess}
        </div>
      )}

      {activeTab === "store" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {REWARD_STORE.map((item) => {
            const isRedeemed = redeemedIds.includes(item.id);
            const canAfford = currentXP >= item.costXP;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  border: isRedeemed ? "1px solid #bbf7d0" : "1px solid var(--border-light)",
                  background: isRedeemed ? "#f0fdf4" : "white",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.75rem" }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      color: isRedeemed ? "#166534" : "var(--color-indigo)",
                    }}
                  >
                    {isRedeemed ? "Unlocked" : `${item.costXP} XP`}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: "1.05rem", margin: "0 0 4px 0", fontWeight: 700 }}>{item.title}</h3>
                  <p className="muted" style={{ fontSize: "0.84rem", margin: 0, lineHeight: 1.45 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ marginTop: "auto" }}>
                  {isRedeemed ? (
                    <button
                      disabled
                      className="btn btn-sm btn-block"
                      style={{ background: "#dcfce7", color: "#166534", border: "none", cursor: "default" }}
                    >
                      <Check size={14} /> Active & Claimed
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm btn-block"
                      disabled={!canAfford}
                      onClick={() => handleRedeem(item)}
                    >
                      {canAfford ? (
                        <>
                          <Gift size={14} /> Redeem for {item.costXP} XP
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Need {item.costXP - currentXP} More XP
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "levels" && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>
            Mastery Hierarchy & Level Perks
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LEVEL_TIERS.map((tier) => {
              const isCurrent = tier.level === currentTier.level;
              return (
                <div
                  key={tier.level}
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius)",
                    border: isCurrent ? "2px solid var(--color-indigo)" : "1px solid var(--border-light)",
                    background: isCurrent ? "var(--color-ice-silver)" : "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: isCurrent ? "var(--color-indigo)" : "#f1f5f9",
                        color: isCurrent ? "white" : "var(--color-navy)",
                        fontWeight: 700,
                      }}
                    >
                      <Medal size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "1rem" }}>
                        Level {tier.level}: {tier.title}
                      </strong>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        Requirement: {tier.minXP.toLocaleString()} – {tier.maxXP.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                  {isCurrent && (
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: "var(--color-indigo)",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      Current Rank
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>
            Experience Points (XP) Ledger
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {historyLog.map((log) => {
              const isGain = log.xp.startsWith("+");
              return (
                <div
                  key={log.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.92rem", display: "block" }}>{log.event}</strong>
                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                      {log.date}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      color: isGain ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {log.xp}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
