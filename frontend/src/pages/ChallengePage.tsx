import { useState } from "react";
import { Award, CircleCheck, CircleX, Zap } from "lucide-react";
import { api } from "../api/client";
import type { ChallengeResult, Option } from "../api/types";
import { ErrorBox, Loading } from "../components/States";
import { useLoad } from "../hooks";

const OPTIONS: Option[] = ["A", "B", "C", "D"];

export default function ChallengePage() {
  const { data: c, error, loading, reload } = useLoad(api.dailyChallenge);
  const [choice, setChoice] = useState<Option | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) return <Loading label="Loading today's challenge…" />;
  if (error || !c) return <ErrorBox message={error ?? "No challenge"} onRetry={reload} />;

  const submit = async () => {
    if (!choice) return;
    setBusy(true);
    setSubmitError(null);
    try {
      setResult(await api.submitChallenge(c.id, choice));
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Either this session's result or the stored submission from an earlier visit.
  const done = result ?? (c.has_completed && c.user_submission
    ? { is_correct: !!c.user_submission.is_correct, points_awarded: c.user_submission.points_awarded, correct_option: c.correct_option ?? "", explanation: c.explanation ?? "" }
    : null);
  const picked = result ? choice : (c.user_submission?.submitted_answer as Option | undefined) ?? choice;

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1><Zap size={26} aria-hidden /> Daily challenge</h1>
          <p className="muted">One attempt. Correct answers earn {c.points} points and the "Daily Code Breaker" badge.</p>
        </div>
      </header>
      <section className="card question">
        <div className="row-between">
          <strong>{c.title}</strong>
          <span className="badge">{c.difficulty} · {c.points} pts</span>
        </div>
        <p>{c.description}</p>
        <pre className="code">{c.code_snippet}</pre>
        <fieldset className="options" disabled={!!done || busy}>
          <legend className="sr-only">Choose one answer</legend>
          {OPTIONS.map((o) => {
            const cls = done ? (o === done.correct_option ? "correct" : o === picked ? "wrong" : "") : choice === o ? "chosen" : "";
            return (
              <label key={o} className={`option ${cls}`}>
                <input type="radio" name="challenge" checked={picked === o} onChange={() => setChoice(o)} />
                <span className="option-key">{o}</span>
                <code>{c[`option_${o.toLowerCase()}` as "option_a"]}</code>
              </label>
            );
          })}
        </fieldset>
        {submitError && <ErrorBox message={submitError} />}
        {done ? (
          <div className={`alert ${done.is_correct ? "alert-success" : "alert-error"}`} role="status">
            {done.is_correct ? <CircleCheck size={18} aria-hidden /> : <CircleX size={18} aria-hidden />}
            <div>
              <strong>{done.is_correct ? `Correct! +${done.points_awarded} points` : "Not quite. No points this time."}</strong>
              {done.is_correct && <p><Award size={14} aria-hidden /> Badge: Daily Code Breaker</p>}
              <p>{done.explanation}</p>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-block" disabled={!choice || busy} onClick={submit}>
            {busy ? "Checking…" : "Submit answer"}
          </button>
        )}
      </section>
    </div>
  );
}
