import { api } from "../api/client";
import { Empty, ErrorBox, Loading, formatDate, levelClass } from "../components/States";
import { navigate, useLoad } from "../hooks";

export default function HistoryPage() {
  const { data, error, loading, reload } = useLoad(api.history);
  if (loading) return <Loading label="Loading your results…" />;
  if (error || !data) return <ErrorBox message={error ?? "No data"} onRetry={reload} />;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>My results</h1>
          <p className="muted">Every completed assessment is saved to your account and only visible to you.</p>
        </div>
      </header>
      <section className="card">
        {data.attempts.length === 0 ? (
          <Empty title="No saved results yet">
            <button className="btn btn-primary" onClick={() => navigate("assessment")}>Take your first assessment</button>
          </Empty>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Subject</th><th>Score</th><th>Level</th><th></th></tr>
            </thead>
            <tbody>
              {data.attempts.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.created_at)}</td>
                  <td>{a.subject_title}</td>
                  <td><strong>{a.score}/{a.total}</strong> <span className="muted">({a.percentage}%)</span></td>
                  <td><span className={levelClass(a.proficiency_level)}>{a.proficiency_level}</span></td>
                  <td><a href={`#/result/${a.id}`}>Review</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
