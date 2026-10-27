import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Code2,
  GraduationCap,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Send,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { api } from "../api/client";
import type { ChatMessage } from "../api/types";
import Markdown from "../components/Markdown";
import { DemoBadge, Empty, ErrorBox, Loading } from "../components/States";
import { navigate, useLoad } from "../hooks";

interface ChatThread {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  lastMessage: string;
  messages: ChatMessage[];
  conceptMastery: number;
  keyTakeaways: string[];
}

const DEFAULT_THREADS: ChatThread[] = [
  {
    id: "thread-python-1",
    title: "Python Async & Slicing",
    subject: "Python Programming",
    createdAt: "Today",
    lastMessage: "Explain sequence slicing with negative steps",
    conceptMastery: 78,
    keyTakeaways: [
      "Slice syntax: sequence[start:stop:step]",
      "Negative step reverses sequence traversal",
      "Generator expressions yield memory-efficient iterators",
    ],
    messages: [
      {
        id: "msg-p1",
        user_id: "demo",
        subject: "Python Programming",
        role: "user",
        content: "How does sequence slicing with negative steps work in Python?",
        suggested_followups: [
          "What is the time complexity of a reverse slice?",
          "How to reverse a list in-place vs slice?",
        ],
        is_mock: true,
        provider: "local-demo",
      },
      {
        id: "msg-p2",
        user_id: "demo",
        subject: "Python Programming",
        role: "assistant",
        content:
          "In Python, slicing syntax is `sequence[start:stop:step]`.\n\nWhen `step` is negative:\n1. The default `start` is the last index `-1`.\n2. The default `stop` extends past the first element.\n3. Python moves backwards by `abs(step)` elements.\n\n```python\narr = [10, 20, 30, 40, 50]\nprint(arr[::-1])  # Output: [50, 40, 30, 20, 10]\nprint(arr[4:1:-1]) # Output: [50, 40, 30]\n```\n\nNotice that the `stop` index (1) is non-inclusive, so index 1 (value 20) is omitted.",
        suggested_followups: [
          "Can slicing be used to modify mutable lists in place?",
          "Explain memory implications of copying slices",
        ],
        is_mock: true,
        provider: "local-demo",
      },
    ],
  },
  {
    id: "thread-biology-1",
    title: "DNA Transcription & Translation",
    subject: "Biology",
    createdAt: "Yesterday",
    lastMessage: "What is the role of DNA Helicase at the replication fork?",
    conceptMastery: 65,
    keyTakeaways: [
      "Helicase unwinds the double helix by breaking hydrogen bonds",
      "Single-Strand Binding Proteins prevent re-annealing",
      "RNA Primase synthesizes primers for DNA Polymerase III",
    ],
    messages: [
      {
        id: "msg-b1",
        user_id: "demo",
        subject: "Biology",
        role: "user",
        content: "What is the role of DNA Helicase at the replication fork?",
        suggested_followups: [
          "How do Topoisomerases relieve supercoiling tension?",
          "Compare Okazaki fragment synthesis on lagging vs leading strand",
        ],
        is_mock: true,
        provider: "local-demo",
      },
      {
        id: "msg-b2",
        user_id: "demo",
        subject: "Biology",
        role: "assistant",
        content:
          "**DNA Helicase** acts as the molecular motor that unwinds the double-stranded DNA molecule.\n\n### Mechanism:\n- **Bond Breaking:** It breaks hydrogen bonds between complementary base pairs (A=T, G≡C).\n- **Energy Consumption:** Utilizes ATP hydrolysis to translocate along the phosphodiester backbone.\n- **Replication Fork Formation:** Moves ahead of DNA Polymerase, creating the single-stranded template required for replication.",
        suggested_followups: [
          "Explain the role of DNA Ligase on the lagging strand",
          "What proofreading mechanism prevents replication errors?",
        ],
        is_mock: true,
        provider: "local-demo",
      },
    ],
  },
  {
    id: "thread-business-1",
    title: "Market Dynamics & CAC/LTV",
    subject: "Business",
    createdAt: "2 days ago",
    lastMessage: "How do you calculate LTV:CAC ratio and payback period?",
    conceptMastery: 84,
    keyTakeaways: [
      "Target LTV:CAC ratio is generally ≥ 3:1 for sustainable SaaS",
      "Payback period should ideally be < 12 months",
      "Net Revenue Retention (NRR) offsets churn risk",
    ],
    messages: [
      {
        id: "msg-bu1",
        user_id: "demo",
        subject: "Business",
        role: "user",
        content: "How do you calculate Customer Lifetime Value (LTV) to Customer Acquisition Cost (CAC) ratio?",
        suggested_followups: [
          "What are strategies to reduce CAC in B2B?",
          "How does churn rate directly depress LTV?",
        ],
        is_mock: true,
        provider: "local-demo",
      },
      {
        id: "msg-bu2",
        user_id: "demo",
        subject: "Business",
        role: "assistant",
        content:
          "The **LTV:CAC ratio** evaluates the return on investment for sales and marketing.\n\n### Formulas:\n- **CAC** = `Total Sales & Marketing Spend / Number of New Customers Acquired`\n- **LTV** = `(Average Revenue Per Account × Gross Margin %) / Churn Rate`\n\n### Benchmark Interpretations:\n- **< 1.0x:** Losing money on every new customer.\n- **1.0x - 2.5x:** High burn rate; slow or risky growth.\n- **3.0x - 4.0x:** The healthy sweet spot for scaling.\n- **> 5.0x:** Under-investing in acquisition; potential to accelerate market share.",
        suggested_followups: [
          "Explain the difference between logo churn and net revenue churn",
          "How to calculate Customer Payback Period in months",
        ],
        is_mock: true,
        provider: "local-demo",
      },
    ],
  },
  {
    id: "thread-aiml-1",
    title: "Transformers & Attention Mechanism",
    subject: "AI-ML",
    createdAt: "3 days ago",
    lastMessage: "Explain Scaled Dot-Product Attention equation",
    conceptMastery: 91,
    keyTakeaways: [
      "Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V",
      "Scaling factor 1/sqrt(d_k) prevents vanishing gradients in softmax",
      "Multi-Head Attention allows attending to information at different representation subspaces",
    ],
    messages: [
      {
        id: "msg-ai1",
        user_id: "demo",
        subject: "AI-ML",
        role: "user",
        content: "Explain the Scaled Dot-Product Attention formula from 'Attention is All You Need'.",
        suggested_followups: [
          "Why is scaling by sqrt(d_k) necessary?",
          "How does Multi-Head Attention differ from Single-Head?",
        ],
        is_mock: true,
        provider: "local-demo",
      },
      {
        id: "msg-ai2",
        user_id: "demo",
        subject: "AI-ML",
        role: "assistant",
        content:
          "The **Scaled Dot-Product Attention** formula is:\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n\n### Component Breakdown:\n1. **$Q K^T$ (Similarity Score):** Computes pairwise dot-products between Queries and Keys.\n2. **$\\sqrt{d_k}$ (Scaling Factor):** For large projection dimensions $d_k$, dot products grow large in magnitude, pushing softmax into regions with extremely small gradients. Dividing by $\\sqrt{d_k}$ stabilizes gradients.\n3. **$\\text{softmax}(\\dots)$ (Attention Weights):** Normalizes similarity scores into probabilities summing to 1 across tokens.\n4. **$V$ (Weighted Aggregation):** Computes a weighted sum of the Values based on attention probabilities.",
        suggested_followups: [
          "What is the computational complexity with respect to sequence length N?",
          "Explain Causal Masking in Decoder self-attention",
        ],
        is_mock: true,
        provider: "local-demo",
      },
    ],
  },
];

const SUBJECT_STARTERS: Record<string, string[]> = {
  "Python Programming": [
    "Explain default argument mutability in Python",
    "How does sequence slicing with negative steps work?",
    "Why must dictionary keys be hashable and immutable?",
    "List comprehensions vs lazy generator expressions",
    "Explain Python scope and the LEGB rule",
  ],
  Biology: [
    "How does the Golgi apparatus sort and modify proteins?",
    "What is the role of DNA Helicase at the replication fork?",
    "Explain obligatory reabsorption in the proximal convoluted tubule",
    "What is genetic drift and how does it alter allele frequency?",
  ],
  Business: [
    "How do you calculate LTV:CAC ratio and payback period?",
    "Explain Porter's Five Forces analysis with a modern example",
    "What is the difference between Gross Margin and Contribution Margin?",
    "How to structure an effective Go-To-Market (GTM) strategy?",
  ],
  "AI-ML": [
    "Explain Scaled Dot-Product Attention equation",
    "What causes vanishing gradients and how do ResNets fix it?",
    "Explain Bias-Variance tradeoff with mathematical intuition",
    "How does Adam optimizer combine Momentum and RMSprop?",
  ],
  Mathematics: [
    "Explain the product rule and chain rule in calculus",
    "How do 2x2 and 3x3 matrix determinants work?",
    "How to solve exponential and logarithmic equations?",
    "Explain conditional probability and Bayes' Theorem",
  ],
  Physics: [
    "State and explain the work-energy theorem",
    "Explain Coulomb's law and electric field superposition",
    "How does electromagnetic induction generate EMF?",
    "Explain the first law of thermodynamics and heat engines",
  ],
  Chemistry: [
    "What is the Aufbau exception for Chromium (Z=24)?",
    "Explain VSEPR geometry and sp³d² hybridization of SF₆",
    "How does Le Chatelier's principle shift chemical equilibrium?",
    "How to calculate the pH of barium hydroxide Ba(OH)₂?",
  ],
};

type MentorPersona = "socratic" | "code_reviewer" | "exam_prep" | "explainer";

export default function ChatPage() {
  const { data: serverChatData, error: chatErr, loading: chatLoading, reload: reloadChat } =
    useLoad(api.chatHistory);
  const { loading: subLoading } = useLoad(api.subjects);

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem("pragyax_chat_threads");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_THREADS;
      }
    }
    return DEFAULT_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>("thread-python-1");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState("Python Programming");
  const [customSubject, setCustomSubject] = useState("");
  const [newChatTopic, setNewChatTopic] = useState("");
  const [showProgressPanel, setShowProgressPanel] = useState(true);

  // Mentor controls
  const [mentorPersona, setMentorPersona] = useState<MentorPersona>("socratic");
  const [mentorDepth, setMentorDepth] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Persist threads to local storage
  useEffect(() => {
    localStorage.setItem("pragyax_chat_threads", JSON.stringify(threads));
  }, [threads]);

  // Sync server messages into active thread on first load if available
  useEffect(() => {
    if (serverChatData?.messages && serverChatData.messages.length > 0) {
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === "thread-python-1" && t.messages.length <= 2) {
            return {
              ...t,
              messages: [...serverChatData.messages],
              lastMessage: serverChatData.messages[serverChatData.messages.length - 1]?.content || t.lastMessage,
            };
          }
          return t;
        })
      );
    }
  }, [serverChatData]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  if (chatLoading || subLoading) return <Loading label="Loading learning conversations…" />;
  if (chatErr && !serverChatData) return <ErrorBox message={chatErr} onRetry={reloadChat} />;

  const starters =
    SUBJECT_STARTERS[activeThread?.subject] ||
    SUBJECT_STARTERS["Python Programming"] ||
    [];

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending || !activeThread) return;
    setSending(true);
    setSendError(null);
    setInput("");

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      user_id: "",
      subject: activeThread.subject,
      role: "user",
      content: message,
      suggested_followups: [],
      is_mock: true,
      provider: "client",
    };

    const updatedMessages = [...activeThread.messages, optimistic];
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: updatedMessages,
              lastMessage: message,
              conceptMastery: Math.min(100, t.conceptMastery + 3),
            }
          : t
      )
    );

    try {
      // Include persona directive in the prompt
      const personaPrefix =
        mentorPersona === "socratic"
          ? "[Socratic Mentor Mode - Guide through probing questions]: "
          : mentorPersona === "code_reviewer"
          ? "[Code & Logic Reviewer Mode - Scrutinize architecture and edge cases]: "
          : mentorPersona === "exam_prep"
          ? "[Exam Prep Coach Mode - Structure with key formulas and exam recall]: "
          : "[Step-by-Step Explainer Mode - Break down simply from first principles]: ";

      const fullPrompt = `${personaPrefix}(Level: ${mentorDepth}) ${message}`;
      const reply = await api.sendChat(fullPrompt, activeThread.subject);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...t.messages, reply],
                conceptMastery: Math.min(100, t.conceptMastery + 5),
                keyTakeaways: [
                  ...t.keyTakeaways,
                  message.length > 45 ? `${message.slice(0, 42)}…` : message,
                ].slice(-5),
              }
            : t
        )
      );
    } catch (e) {
      setSendError((e as Error).message);
      setInput(message);
      // Revert optimistic
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: t.messages.filter((m) => m.id !== optimistic.id) }
            : t
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewThread = (e: FormEvent) => {
    e.preventDefault();
    const finalSubject = newChatSubject === "custom" ? customSubject.trim() : newChatSubject;
    if (!finalSubject) return;

    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: newChatTopic.trim() || `${finalSubject} Fundamentals`,
      subject: finalSubject,
      createdAt: "Just now",
      lastMessage: "Conversation initiated",
      conceptMastery: 20,
      keyTakeaways: [`Initiated study for ${finalSubject}`],
      messages: [
        {
          id: `welcome-${Date.now()}`,
          user_id: "demo",
          subject: finalSubject,
          role: "assistant",
          content: `Welcome to your dedicated **${finalSubject}** learning session!\n\nI am your AI learning mentor set to **${mentorPersona.replace(
            "_",
            " "
          )}** at **${mentorDepth}** depth. Ask any question, paste a problem, or select one of the suggested topics below.`,
          suggested_followups: SUBJECT_STARTERS[finalSubject]?.slice(0, 3) || [
            `What are the core concepts in ${finalSubject}?`,
            `How should I structure my learning journey for ${finalSubject}?`,
          ],
          is_mock: true,
          provider: "local-demo",
        },
      ],
    };

    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
    setShowNewModal(false);
    setNewChatTopic("");
    setCustomSubject("");
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="page chat-page" style={{ maxWidth: "100%", padding: "16px 24px" }}>
      {/* Top Header */}
      <header className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <Brain size={13} aria-hidden />
            <span>Interactive Learning Chat</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: 4 }}>
            AI Learning Mentor <DemoBadge />
          </h1>
          <p className="muted" style={{ fontSize: "0.92rem" }}>
            Contextual multi-subject tutoring with persistent chats, mentor persona tuning, and real-time concept mastery.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> New Chat
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowProgressPanel(!showProgressPanel)}
            title={showProgressPanel ? "Hide Progress Panel" : "Show Progress Panel"}
          >
            {showProgressPanel ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout: Chat Sidebar | Conversation Area | Progress Panel */}
      <div
        className="chat-workspace"
        style={{
          display: "grid",
          gridTemplateColumns: showProgressPanel ? "280px 1fr 300px" : "280px 1fr",
          gap: 16,
          alignItems: "start",
          minHeight: "75vh",
        }}
      >
        {/* Left Sidebar: Learning Chats */}
        <aside
          className="card chat-threads-sidebar"
          style={{
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            height: "75vh",
            background: "var(--color-white)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--color-navy)" }}>
              Conversations ({threads.length})
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowNewModal(true)}
              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
            >
              <Plus size={14} /> New
            </button>
          </div>

          <div
            className="threads-scroll"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "var(--radius)",
                    border: isActive
                      ? "1px solid var(--color-indigo)"
                      : "1px solid var(--border-light)",
                    background: isActive ? "var(--color-ice-silver)" : "var(--color-white)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                        background:
                          thread.subject === "Python Programming"
                            ? "#e0e7ff"
                            : thread.subject === "Biology"
                            ? "#dcfce7"
                            : thread.subject === "Business"
                            ? "#fef3c7"
                            : "#f3e8ff",
                        color:
                          thread.subject === "Python Programming"
                            ? "#3730a3"
                            : thread.subject === "Biology"
                            ? "#166534"
                            : thread.subject === "Business"
                            ? "#92400e"
                            : "#6b21a8",
                      }}
                    >
                      {thread.subject}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-charcoal-muted)" }}>
                      {thread.createdAt}
                    </span>
                  </div>
                  <strong
                    style={{
                      fontSize: "0.88rem",
                      color: "var(--color-navy)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {thread.title}
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.78rem",
                      color: "var(--color-charcoal-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {thread.lastMessage}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Conversation & Controls */}
        <section
          className="card chat-main"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "75vh",
            padding: 0,
            overflow: "hidden",
            background: "var(--color-white)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Top Mentor Controls Bar */}
          <div
            className="chat-mentor-controls"
            style={{
              padding: "10px 16px",
              background: "var(--color-ice-silver)",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} color="var(--color-indigo)" />
              <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>Mentor Persona:</span>
              <select
                value={mentorPersona}
                onChange={(e) => setMentorPersona(e.target.value as MentorPersona)}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.82rem",
                  borderRadius: 6,
                  border: "1px solid var(--border-light)",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <option value="socratic">Socratic Tutor (Probing Questions)</option>
                <option value="code_reviewer">Code & Logic Reviewer</option>
                <option value="exam_prep">Exam Prep Coach</option>
                <option value="explainer">Step-by-Step Explainer</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>Depth:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMentorDepth(lvl)}
                    style={{
                      padding: "3px 8px",
                      fontSize: "0.76rem",
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: mentorDepth === lvl ? "var(--color-indigo)" : "var(--border-light)",
                      background: mentorDepth === lvl ? "var(--color-indigo)" : "white",
                      color: mentorDepth === lvl ? "white" : "var(--color-navy)",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages Scroll Log */}
          <div
            className="chat-log"
            aria-live="polite"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {messages.length === 0 ? (
              <Empty title={`Start exploring ${activeThread?.subject}`}>
                <p className="muted">
                  Ask any question about <strong>{activeThread?.subject}</strong> concepts, formulas, or pick a starter below.
                </p>
              </Empty>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`msg msg-${m.role}`}>
                  <div className="msg-avatar" aria-hidden>
                    {m.role === "user" ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="msg-bubble">
                    <span className="sr-only">
                      {m.role === "user" ? "You said:" : "Assistant said:"}
                    </span>
                    {m.role === "assistant" ? <Markdown text={m.content} /> : <p>{m.content}</p>}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="msg msg-assistant">
                <div className="msg-avatar" aria-hidden>
                  <Bot size={16} />
                </div>
                <div className="msg-bubble typing" aria-label="Assistant is thinking">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div
            className="chips"
            style={{
              padding: "6px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              background: "var(--color-ice-silver)",
              borderTop: "1px solid var(--border-light)",
            }}
          >
            {(lastAssistant?.suggested_followups?.length ? lastAssistant.suggested_followups : starters)
              .slice(0, 3)
              .map((s) => (
                <button
                  key={s}
                  className="chip"
                  onClick={() => send(s)}
                  disabled={sending}
                  style={{
                    fontSize: "0.78rem",
                    padding: "4px 10px",
                    background: "white",
                    border: "1px solid var(--border-light)",
                    borderRadius: 14,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
          </div>

          {sendError && <ErrorBox message={sendError} />}

          {/* Input Form */}
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{
              padding: 12,
              display: "flex",
              gap: 10,
              borderTop: "1px solid var(--border-light)",
            }}
          >
            <label htmlFor="chat-msg" className="sr-only">
              Your question
            </label>
            <input
              id="chat-msg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${activeThread?.subject} (${activeThread?.title})…`}
              maxLength={2000}
              autoComplete="off"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: "0.92rem",
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px" }}
            >
              <Send size={16} aria-hidden />
            </button>
          </form>
        </section>

        {/* Right Sidebar: Learning Progress Panel */}
        {showProgressPanel && (
          <aside
            className="card chat-progress-panel"
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              height: "75vh",
              background: "var(--color-white)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              overflowY: "auto",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <GraduationCap size={18} color="var(--color-indigo)" />
                <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 700 }}>Learning Progress</h3>
              </div>
              <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
                {activeThread?.subject}
              </p>
            </div>

            {/* Topic Mastery Meter */}
            <div
              style={{
                padding: 14,
                borderRadius: "var(--radius)",
                background: "var(--color-ice-silver)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Estimated Mastery</span>
                <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--color-indigo)" }}>
                  {activeThread?.conceptMastery || 50}%
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  width: "100%",
                  background: "#e2e8f0",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${activeThread?.conceptMastery || 50}%`,
                    background: "var(--color-indigo)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "0.74rem", color: "var(--color-charcoal-muted)", marginTop: 6, display: "block" }}>
                {activeThread?.conceptMastery >= 80
                  ? "High comprehension! Ready for assessment."
                  : "Keep exploring and practicing problems to reach Master."}
              </span>
            </div>

            {/* Key Takeaways */}
            <div>
              <span style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 8 }}>
                Key Takeaways
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(activeThread?.keyTakeaways || []).map((note, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: "0.8rem",
                      lineHeight: 1.4,
                    }}
                  >
                    <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Practice & Assessment Actions */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm btn-block"
                onClick={() => navigate("practice")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Code2 size={15} /> Practice in Sandbox
              </button>
              <button
                className="btn btn-primary btn-sm btn-block"
                onClick={() => navigate("assessment")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                Take Topic Quiz <ArrowRight size={15} />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* New Chat Modal (supports new subjects dynamically) */}
      {showNewModal && (
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
              maxWidth: 480,
              padding: 24,
              background: "white",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MessageSquare size={20} color="var(--color-indigo)" />
              <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>Start New Learning Chat</h2>
            </div>
            <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 16 }}>
              Select an existing subject or enter a new course track to begin an interactive AI tutoring session.
            </p>

            <form onSubmit={handleCreateNewThread} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Select Subject Track
                </label>
                <select
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-light)",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="Python Programming">Python Programming</option>
                  <option value="Biology">Biology (Molecular & Cellular)</option>
                  <option value="Business">Business & Venture Strategy</option>
                  <option value="AI-ML">Artificial Intelligence & Machine Learning</option>
                  <option value="Mathematics">Mathematics & Calculus</option>
                  <option value="Physics">Physics & Mechanics</option>
                  <option value="Chemistry">Chemistry & Thermodynamics</option>
                  <option value="custom">+ Enter New Subject</option>
                </select>
              </div>

              {newChatSubject === "custom" && (
                <div>
                  <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Custom Subject Name
                  </label>
                  <input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. Distributed Systems, Genetics, Microeconomics"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border-light)",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.84rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Initial Topic / Question (Optional)
                </label>
                <input
                  value={newChatTopic}
                  onChange={(e) => setNewChatTopic(e.target.value)}
                  placeholder="e.g. Neural Networks Backpropagation, Gene Editing..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border-light)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  Start Chat <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
