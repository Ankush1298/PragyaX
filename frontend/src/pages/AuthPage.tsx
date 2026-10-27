import { useState, type FormEvent } from "react";
import { GraduationCap, Lock, Sparkles, Target, Trophy } from "lucide-react";
import { api } from "../api/client";
import type { User } from "../api/types";
import { ErrorBox } from "../components/States";

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;

export default function AuthPage({ onAuth }: { onAuth: (u: User, token: string, isNew: boolean) => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = () => {
    if (mode === "register" && name.trim().length < 2) return "Please enter your name (at least 2 characters).";
    if (!EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";
    if (mode === "register" && password.length < 6) return "Password must be at least 6 characters.";
    if (!password) return "Please enter your password.";
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
        mode === "register" ? await api.register(name.trim(), email.trim(), password) : await api.login(email.trim(), password);
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
  };

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand brand-xl">
          <GraduationCap size={34} aria-hidden /> Pragya<span className="brand-x">X</span>
        </div>
        <h1>AI-powered gamified learning.</h1>
        <p className="lead">From theory to practice: learn a concept, test yourself, and get instant feedback.</p>
        <ul className="hero-points">
          <li><Sparkles size={18} aria-hidden /> Ask the learning assistant anything about Python</li>
          <li><Target size={18} aria-hidden /> Take a 5-question assessment graded on the server</li>
          <li><Trophy size={18} aria-hidden /> Track progress, earn points and badges</li>
        </ul>
      </section>

      <section className="auth-card card">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "tab active" : "tab"} onClick={() => switchMode("register")}>
            Create account
          </button>
          <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "tab active" : "tab"} onClick={() => switchMode("login")}>
            Log in
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {mode === "register" && (
            <label className="field">
              <span>Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Asha Sharma" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@college.edu" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
            />
          </label>
          {error && <ErrorBox message={error} />}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : mode === "register" ? "Create account & start learning" : "Log in"}
          </button>
        </form>
        <p className="fine">
          <Lock size={13} aria-hidden /> Demo authentication: passwords are hashed (PBKDF2) and sessions are stored locally.
          Not production-ready.
        </p>
      </section>
    </div>
  );
}
