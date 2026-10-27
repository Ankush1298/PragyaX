import { useState } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, Send } from "lucide-react";
import { api } from "../api/client";
import type { Option, Question } from "../api/types";
import { DemoBadge, ErrorBox, Loading } from "../components/States";
import { navigate, useLoad } from "../hooks";

const OPTIONS: Option[] = ["A", "B", "C", "D"];
const optionText = (q: Question, o: Option) => q[`option_${o.toLowerCase()}` as "option_a"];

async function loadAssessment() {
  const { subjects, selected_subject_id } = await api.subjects();
  const subject = subjects.find((s) => s.id === selected_subject_id) ?? subjects[0];
  const questions = await api.questions(subject.id);
  return { subject, questions };
}

export default function AssessmentPage() {
  const { data, error, loading, reload } = useLoad(loadAssessment);
  const [step, setStep] = useState(0); // 0..4 questions, 5 = review
  const [answers, setAnswers] = useState<Record<string, Option>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) return <Loading label="Loading your assessment…" />;
  if (error || !data) return <ErrorBox message={error ?? "No data"} onRetry={reload} />;

  const { subject, questions } = data;
  const total = questions.length;
  const answered = questions.filter((q) => answers[q.id]).length;
  const isReview = step === total;
  const q = questions[step];

  const submit = async () => {
    if (answered < total || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.submitAssessment(subject.id, answers);
      navigate(`result/${result.id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>{subject.title} assessment</h1>
          <p className="muted">{total} questions · graded on the server <DemoBadge label="Mock Evaluation" /></p>
        </div>
      </header>

      <ol className="stepper" aria-label="Assessment progress">
        {questions.map((qq, i) => (
          <li key={qq.id}>
            <button
              className={`step ${i === step ? "current" : ""} ${answers[qq.id] ? "answered" : ""}`}
              onClick={() => setStep(i)}
              aria-label={`Question ${i + 1}${answers[qq.id] ? ", answered" : ""}`}
              aria-current={i === step ? "step" : undefined}
            >
              {answers[qq.id] ? <CircleCheck size={16} aria-hidden /> : i + 1}
            </button>
          </li>
        ))}
        <li>
          <button className={`step step-review ${isReview ? "current" : ""}`} onClick={() => setStep(total)} aria-current={isReview ? "step" : undefined}>
            Review
          </button>
        </li>
      </ol>

      {!isReview ? (
        <section className="card question">
          <div className="row-between">
            <span className="muted small">Question {step + 1} of {total}</span>
            <span className="badge">{q.topic}</span>
          </div>
          <pre className="question-text">{q.question_text}</pre>
          <fieldset className="options">
            <legend className="sr-only">Choose one answer</legend>
            {OPTIONS.map((o) => (
              <label key={o} className={`option ${answers[q.id] === o ? "chosen" : ""}`}>
                <input
                  type="radio"
                  name={q.id}
                  value={o}
                  checked={answers[q.id] === o}
                  onChange={() => setAnswers({ ...answers, [q.id]: o })}
                />
                <span className="option-key">{o}</span>
                <span>{optionText(q, o)}</span>
              </label>
            ))}
          </fieldset>
          <div className="row-between">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ArrowLeft size={15} aria-hidden /> Previous
            </button>
            <button className="btn btn-primary" disabled={!answers[q.id]} onClick={() => setStep(step + 1)}>
              {step === total - 1 ? "Review answers" : "Next"} <ArrowRight size={15} aria-hidden />
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Review your answers</h2>
          <p className="muted">{answered} of {total} answered. You can submit only once per attempt.</p>
          <ul className="review-list">
            {questions.map((qq, i) => (
              <li key={qq.id}>
                <button className="link" onClick={() => setStep(i)}>Q{i + 1}. {qq.topic}</button>
                <span className={answers[qq.id] ? "badge" : "badge badge-warn"}>
                  {answers[qq.id] ? `Answer ${answers[qq.id]}` : "Not answered"}
                </span>
              </li>
            ))}
          </ul>
          {submitError && <ErrorBox message={submitError} />}
          <button className="btn btn-primary btn-block" disabled={answered < total || submitting} onClick={submit}>
            <Send size={15} aria-hidden /> {submitting ? "Evaluating…" : answered < total ? `Answer all ${total} questions to submit` : "Submit for evaluation"}
          </button>
        </section>
      )}
    </div>
  );
}
