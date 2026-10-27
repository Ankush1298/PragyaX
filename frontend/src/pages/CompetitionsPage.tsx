import { useState } from "react";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";
import { useLoad } from "../hooks";
import { api } from "../api/client";

interface ChallengeEvent {
  id: string;
  title: string;
  organizer: string;
  category: "college" | "company";
  status: "active" | "upcoming" | "past";
  registrationDeadline: string;
  eventDate: string;
  participantsCount: number;
  prizePool: string;
  eligibility: string;
  summary: string;
  tracks: string[];
}

const INITIAL_EVENTS: ChallengeEvent[] = [
  {
    id: "evt-1",
    title: "Inter-College Autonomous AI Hackathon 2026",
    organizer: "Indian Institute of Science & PragyaX",
    category: "college",
    status: "active",
    registrationDeadline: "Nov 15, 2026",
    eventDate: "Nov 20 - Nov 22, 2026",
    participantsCount: 420,
    prizePool: "₹2,50,000 + PPO Interviews",
    eligibility: "Enrolled Undergraduate & Postgraduate Students",
    summary:
      "Compete against collegiate engineering teams to build low-latency RAG agents, real-time code execution sandboxes, and automated assessment evaluators.",
    tracks: ["Python Systems", "AI-ML Architecture", "Distributed Data"],
  },
  {
    id: "evt-2",
    title: "ScaleDown Systems Challenge",
    organizer: "HyperScale Cloud Systems Inc.",
    category: "company",
    status: "active",
    registrationDeadline: "Nov 10, 2026",
    eventDate: "Nov 14, 2026",
    participantsCount: 285,
    prizePool: "₹1,00,000 + Cloud Credits",
    eligibility: "Open to All Developers & Engineers",
    summary:
      "Optimize an un-indexed multi-gigabyte query engine. Highest query throughput and lowest memory consumption wins direct interview fast-track.",
    tracks: ["Concurrency & Memory", "Database Internals", "Algorithm Optimization"],
  },
  {
    id: "evt-3",
    title: "National Bio-Informatics & Genomics Sprint",
    organizer: "National BioTech Consortium",
    category: "college",
    status: "upcoming",
    registrationDeadline: "Dec 01, 2026",
    eventDate: "Dec 05 - Dec 07, 2026",
    participantsCount: 160,
    prizePool: "₹1,50,000 Research Fellowship",
    eligibility: "Life Sciences, Biotech, and Computer Science Students",
    summary:
      "Design fast sequence alignment heuristics and structural protein prediction pipelines tested against benchmark viral genomic datasets.",
    tracks: ["Genomic Sequences", "CRISPR Analysis", "Dynamic Programming"],
  },
  {
    id: "evt-4",
    title: "FinTech High-Frequency Risk Engine Arena",
    organizer: "AlphaQuant Capital Partners",
    category: "company",
    status: "past",
    registrationDeadline: "Oct 15, 2026",
    eventDate: "Oct 18, 2026",
    participantsCount: 512,
    prizePool: "₹3,00,000 + Senior Analyst Offers",
    eligibility: "All registered PragyaX accounts with Level ≥ 4",
    summary:
      "Construct sub-millisecond risk limits computation engines for volatile multi-asset synthetic order books.",
    tracks: ["Python C-Extensions", "Financial Modeling", "Low-Latency Queues"],
  },
];

export default function CompetitionsPage() {
  const { data: user } = useLoad(api.me);
  const [events, setEvents] = useState<ChallengeEvent[]>(INITIAL_EVENTS);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(["evt-1"]);
  const [selectedEvent, setSelectedEvent] = useState<ChallengeEvent | null>(INITIAL_EVENTS[0]);

  // Form for new event
  const [newTitle, setNewTitle] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newCategory, setNewCategory] = useState<"college" | "company">("college");
  const [newPrize, setNewPrize] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const isAuthorizedOrg = user?.role === "admin" || user?.email?.includes("college") || user?.email?.includes("admin");

  const filteredEvents = events.filter(
    (e) => filterCategory === "all" || e.category === filterCategory
  );

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOrg.trim()) return;

    const newEvt: ChallengeEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      organizer: newOrg.trim(),
      category: newCategory,
      status: "upcoming",
      registrationDeadline: newDeadline || "Dec 15, 2026",
      eventDate: "Dec 20 - Dec 22, 2026",
      participantsCount: 1,
      prizePool: newPrize.trim() || "Certificates of Excellence",
      eligibility: "Verified College Students & Developers",
      summary: newSummary.trim() || "Inter-institution technical benchmark competition.",
      tracks: ["Practical Engineering", "Real-world Problem Solving"],
    };

    setEvents([newEvt, ...events]);
    setShowCreateModal(false);
    setSelectedEvent(newEvt);
    setNewTitle("");
    setNewOrg("");
    setNewPrize("");
    setNewSummary("");
  };

  const handleJoin = (eventId: string) => {
    if (joinedEventIds.includes(eventId)) return;
    setJoinedEventIds([...joinedEventIds, eventId]);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, participantsCount: e.participantsCount + 1 } : e
      )
    );
  };

  return (
    <div className="page competitions-page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <Building2 size={13} aria-hidden />
            <span>Collegiate & Corporate Arenas</span>
          </div>
          <h1>College & Company Challenges</h1>
          <p className="muted">
            Represent your university or compete in sponsored corporate engineering challenges with cash prizes, interview fast-tracks, and industry recognition.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAuthorizedOrg ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Host Organization Challenge
            </button>
          ) : (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--color-charcoal-muted)",
                padding: "6px 12px",
                borderRadius: 6,
                background: "var(--color-ice-silver)",
                border: "1px solid var(--border-light)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldAlert size={14} color="var(--color-indigo)" />
              <span>Org Management: Institutional Partners Only</span>
            </div>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "all", label: "All Competitions" },
          { key: "college", label: "🏫 Inter-College Hackathons" },
          { key: "company", label: "🏢 Corporate Hiring Challenges" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key)}
            className={`btn btn-sm ${filterCategory === tab.key ? "btn-primary" : "btn-ghost"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Challenge Cards & Selected Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, alignItems: "start" }}>
        {/* Challenge Cards List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredEvents.map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;
            const isJoined = joinedEventIds.includes(evt.id);

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="card"
                style={{
                  padding: 20,
                  cursor: "pointer",
                  border: isSelected ? "2px solid var(--color-indigo)" : "1px solid var(--border-light)",
                  background: isSelected ? "var(--color-ice-silver)" : "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: evt.category === "college" ? "#e0e7ff" : "#fef3c7",
                      color: evt.category === "college" ? "#3730a3" : "#92400e",
                    }}
                  >
                    {evt.category === "college" ? "Collegiate Hackathon" : "Corporate Challenge"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      color:
                        evt.status === "active"
                          ? "#16a34a"
                          : evt.status === "upcoming"
                          ? "var(--color-indigo)"
                          : "var(--color-charcoal-muted)",
                    }}
                  >
                    ● {evt.status.toUpperCase()}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.08rem", margin: 0, fontWeight: 700 }}>{evt.title}</h3>
                <div style={{ fontSize: "0.82rem", color: "var(--color-charcoal-muted)" }}>
                  Organized by: <strong>{evt.organizer}</strong>
                </div>

                <p
                  className="muted"
                  style={{
                    fontSize: "0.84rem",
                    margin: 0,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {evt.summary}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.8rem",
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--color-indigo)" }}>
                    🏆 {evt.prizePool}
                  </span>
                  <span className="muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={14} /> {evt.participantsCount} Registered
                  </span>
                </div>

                {isJoined && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.78rem",
                      color: "#166534",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={14} /> You are registered for this event
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Event Details Panel */}
        {selectedEvent && (
          <section className="card" style={{ padding: 24, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <span className="badge-pill" style={{ marginBottom: 6 }}>
                  {selectedEvent.organizer}
                </span>
                <h2 style={{ fontSize: "1.3rem", margin: "4px 0 8px 0", fontWeight: 800 }}>
                  {selectedEvent.title}
                </h2>
                <div style={{ fontSize: "0.84rem", color: "var(--color-charcoal-muted)" }}>
                  Eligibility: <strong>{selectedEvent.eligibility}</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius)",
                background: "var(--color-ice-silver)",
                border: "1px solid var(--border-light)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem" }}>
                <Calendar size={16} color="var(--color-indigo)" />
                <span>
                  Competition Window: <strong>{selectedEvent.eventDate}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem" }}>
                <Clock size={16} color="var(--color-indigo)" />
                <span>
                  Registration Deadline: <strong>{selectedEvent.registrationDeadline}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem" }}>
                <Trophy size={16} color="#d97706" />
                <span>
                  Prizes & Rewards: <strong>{selectedEvent.prizePool}</strong>
                </span>
              </div>
            </div>

            <h4 style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: 6 }}>Problem Scope</h4>
            <p className="muted" style={{ fontSize: "0.88rem", lineHeight: 1.5, marginBottom: 16 }}>
              {selectedEvent.summary}
            </p>

            <h4 style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: 8 }}>Evaluation Tracks</h4>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {selectedEvent.tracks.map((trk) => (
                <span
                  key={trk}
                  style={{
                    fontSize: "0.78rem",
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "#e0e7ff",
                    color: "#3730a3",
                    fontWeight: 600,
                  }}
                >
                  {trk}
                </span>
              ))}
            </div>

            {joinedEventIds.includes(selectedEvent.id) ? (
              <button
                disabled
                className="btn btn-block"
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} /> Registration Confirmed
              </button>
            ) : (
              <button
                className="btn btn-primary btn-block"
                onClick={() => handleJoin(selectedEvent.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Award size={16} /> Register for Competition <ChevronRight size={16} />
              </button>
            )}

            {isAuthorizedOrg && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: "var(--radius)",
                  border: "1px dashed var(--border-light)",
                  fontSize: "0.78rem",
                  color: "var(--color-charcoal-muted)",
                }}
              >
                <strong>Institutional Admin Tools:</strong> You have administrative privileges to inspect registered participant submissions and manage scoring rubrics.
              </div>
            )}
          </section>
        )}
      </div>

      {/* Organization Challenge Creation Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 520,
              padding: 24,
              background: "white",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Building2 size={22} color="var(--color-indigo)" />
              <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>Host an Official Challenge</h2>
            </div>
            <p className="muted" style={{ fontSize: "0.86rem", marginBottom: 16 }}>
              Deploy a collegiate hackathon or corporate hiring arena to the global PragyaX community.
            </p>

            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Challenge Title *
                </label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Apex High-Concurrency Systems Challenge"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Hosting Organization *
                </label>
                <input
                  required
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  placeholder="e.g. IIT Delhi or Cloudflare Labs"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as "college" | "company")}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                  >
                    <option value="college">College Hackathon</option>
                    <option value="company">Corporate Challenge</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Prize Pool
                  </label>
                  <input
                    value={newPrize}
                    onChange={(e) => setNewPrize(e.target.value)}
                    placeholder="e.g. ₹1,00,000"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Challenge Summary & Problem Scope
                </label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Describe the challenge goals, datasets, and testing rules..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-light)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
