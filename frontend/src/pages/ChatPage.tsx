import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Bot, Send, User as UserIcon } from "lucide-react";
import { api } from "../api/client";
import type { ChatMessage } from "../api/types";
import Markdown from "../components/Markdown";
import { DemoBadge, Empty, ErrorBox, Loading } from "../components/States";
import { navigate, useLoad } from "../hooks";

const STARTERS = ["What are Python data types?", "How do list comprehensions work?", "Explain Python scope (LEGB)", "Why can't a list be a dictionary key?"];

export default function ChatPage() {
  const { data, error, loading, reload, setData } = useLoad(api.chatHistory);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending || !data) return;
    setSending(true);
    setSendError(null);
    setInput("");
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`, user_id: "", subject: "Python Programming", role: "user",
      content: message, suggested_followups: [], is_mock: data.is_mock, provider: "",
    };
    setData({ ...data, messages: [...data.messages, optimistic] });
    try {
      const reply = await api.sendChat(message, "Python Programming");
      setData((d) => (d ? { ...d, messages: [...d.messages, reply] } : d));
    } catch (e) {
      setSendError((e as Error).message);
      setInput(message);
      setData((d) => (d ? { ...d, messages: d.messages.filter((m) => m.id !== optimistic.id) } : d));
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  if (loading) return <Loading label="Loading your conversation…" />;
  if (error || !data) return <ErrorBox message={error ?? "No data"} onRetry={reload} />;

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="page chat-page">
      <header className="page-head">
        <div>
          <h1>Learning Chat {data.is_mock && <DemoBadge />}</h1>
          <p className="muted">Ask about any core Python concept. Your conversation is saved to your account.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate("subjects")}>
          Next: choose subject <ArrowRight size={15} aria-hidden />
        </button>
      </header>

      <section className="card chat">
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 && (
            <Empty title="Start a conversation">
              <p className="muted">Pick a starter question or type your own below.</p>
            </Empty>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`msg msg-${m.role}`}>
              <div className="msg-avatar" aria-hidden>{m.role === "user" ? <UserIcon size={16} /> : <Bot size={16} />}</div>
              <div className="msg-bubble">
                <span className="sr-only">{m.role === "user" ? "You said:" : "Assistant said:"}</span>
                {m.role === "assistant" ? <Markdown text={m.content} /> : <p>{m.content}</p>}
              </div>
            </div>
          ))}
          {sending && (
            <div className="msg msg-assistant">
              <div className="msg-avatar" aria-hidden><Bot size={16} /></div>
              <div className="msg-bubble typing" aria-label="Assistant is typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="chips">
          {(lastAssistant?.suggested_followups.length ? lastAssistant.suggested_followups : STARTERS).map((s) => (
            <button key={s} className="chip" onClick={() => send(s)} disabled={sending}>{s}</button>
          ))}
        </div>

        {sendError && <ErrorBox message={sendError} />}
        <form className="chat-input" onSubmit={onSubmit}>
          <label htmlFor="chat-msg" className="sr-only">Your question</label>
          <input
            id="chat-msg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How do decorators work?"
            maxLength={2000}
            autoComplete="off"
          />
          <button className="btn btn-primary" disabled={sending || !input.trim()} aria-label="Send message">
            <Send size={16} aria-hidden />
          </button>
        </form>
      </section>
    </div>
  );
}
