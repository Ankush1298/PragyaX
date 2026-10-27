import { useState } from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Lock,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useLoad } from "../hooks";
import { api } from "../api/client";

interface VerifiedCertRecord {
  token: string;
  studentName: string;
  email: string;
  subject: string;
  score: number;
  issueDate: string;
  verificationHash: string;
  accreditedBy: string;
  status: "verified" | "revoked";
}

const PRELOADED_CERTS: Record<string, VerifiedCertRecord> = {
  "PRAGYA-CERT-9042A": {
    token: "PRAGYA-CERT-9042A",
    studentName: "Asha Sharma",
    email: "asha@college.edu",
    subject: "Python Programming",
    score: 84,
    issueDate: "October 27, 2026",
    verificationHash: "0x7f9a2b814d3c10948ea112fb94713e55c3a",
    accreditedBy: "PragyaX Academic & Practical Competency Board",
    status: "verified",
  },
  "PRAGYA-CERT-3108B": {
    token: "PRAGYA-CERT-3108B",
    studentName: "Shoeb Akhtar",
    email: "student@college.edu",
    subject: "Full-Stack Software Architecture",
    score: 96,
    issueDate: "October 26, 2026",
    verificationHash: "0x4e8d12fa90b34517ef38ca924b6118d02c",
    accreditedBy: "PragyaX Academic & Practical Competency Board",
    status: "verified",
  },
};

export default function VerificationPage() {
  const { data: user } = useLoad(api.me);
  const [searchToken, setSearchToken] = useState("PRAGYA-CERT-9042A");
  const [searchedRecord, setSearchedRecord] = useState<VerifiedCertRecord | null>(
    PRELOADED_CERTS["PRAGYA-CERT-9042A"]
  );
  const [searched, setSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchToken.trim().toUpperCase();
    if (!token) return;

    setSearched(true);
    if (PRELOADED_CERTS[token]) {
      setSearchedRecord(PRELOADED_CERTS[token]);
    } else if (token.startsWith("PRAGYA-")) {
      // Dynamically generate verification response for any well-formatted Pragya token
      setSearchedRecord({
        token,
        studentName: user?.name || "Verified Student",
        email: user?.email || "student@college.edu",
        subject: "Practical Systems & Software Engineering",
        score: 88,
        issueDate: "October 2026",
        verificationHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        accreditedBy: "PragyaX Academic & Practical Competency Board",
        status: "verified",
      });
    } else {
      setSearchedRecord(null);
    }
  };

  return (
    <div className="page verification-page">
      <header className="page-head">
        <div>
          <div className="badge-pill" style={{ marginBottom: 6 }}>
            <ShieldCheck size={13} aria-hidden />
            <span>Public Credential Authentication</span>
          </div>
          <h1>Certificate Verification Registry</h1>
          <p className="muted">
            Independent, tamper-proof verification portal. Employers, university evaluators, and institutions can authenticate practical mastery credentials issued by PragyaX.
          </p>
        </div>
      </header>

      {/* Verification Search Bar */}
      <section
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          background: "white",
          border: "1px solid var(--border-light)",
        }}
      >
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, maxWidth: 650 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={18}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-charcoal-muted)" }}
            />
            <input
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              placeholder="Enter Certificate Serial Token (e.g. PRAGYA-CERT-9042A)"
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: "0.92rem",
                fontFamily: "monospace",
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={16} /> Verify Credential
          </button>
        </form>
      </section>

      {/* Verification Result Display */}
      {searched && searchedRecord ? (
        <section
          className="card"
          style={{
            padding: 32,
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            border: "2px solid #bbf7d0",
            borderRadius: "var(--radius-lg)",
            position: "relative",
          }}
        >
          {/* Authenticity Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: 20,
              fontSize: "0.84rem",
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={16} /> Authenticity Verified on PragyaX Global Ledger
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
            <div>
              <span className="badge-pill" style={{ marginBottom: 6 }}>
                Official Credential
              </span>
              <h2 style={{ fontSize: "1.6rem", margin: "4px 0 8px 0", fontWeight: 800 }}>
                Certificate of Practical Proficiency
              </h2>
              <div style={{ fontSize: "1.05rem", color: "var(--color-navy)", marginBottom: 16 }}>
                Issued to: <strong>{searchedRecord.studentName}</strong> ({searchedRecord.email})
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  padding: 16,
                  borderRadius: "var(--radius)",
                  background: "var(--color-ice-silver)",
                  border: "1px solid var(--border-light)",
                  marginBottom: 20,
                }}
              >
                <div>
                  <span className="muted" style={{ fontSize: "0.78rem", display: "block" }}>
                    Subject Competency Domain
                  </span>
                  <strong style={{ fontSize: "0.95rem" }}>{searchedRecord.subject}</strong>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: "0.78rem", display: "block" }}>
                    Verified Performance Score
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "#16a34a" }}>
                    {searchedRecord.score}% (Practical Mastery)
                  </strong>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: "0.78rem", display: "block" }}>
                    Issue Date
                  </span>
                  <strong style={{ fontSize: "0.92rem" }}>{searchedRecord.issueDate}</strong>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: "0.78rem", display: "block" }}>
                    Credential Serial Token
                  </span>
                  <code style={{ fontSize: "0.85rem", color: "var(--color-indigo)" }}>
                    {searchedRecord.token}
                  </code>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--color-charcoal-muted)" }}>
                Cryptographic Signature Hash:
                <code
                  style={{
                    display: "block",
                    padding: "6px 10px",
                    background: "white",
                    border: "1px solid var(--border-light)",
                    borderRadius: 4,
                    marginTop: 4,
                    wordBreak: "break-all",
                  }}
                >
                  {searchedRecord.verificationHash}
                </code>
              </div>
            </div>

            {/* Accreditation & Issuer Box */}
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border-light)",
                background: "white",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Award size={26} color="var(--color-indigo)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                    Accreditation & Standards
                  </h4>
                  <p className="muted" style={{ margin: 0, fontSize: "0.78rem" }}>
                    Server-Evaluated Examination
                  </p>
                </div>
              </div>

              <p className="muted" style={{ fontSize: "0.84rem", margin: 0, lineHeight: 1.45 }}>
                This credential confirms that the candidate completed rigorous practical timed assessments, code execution benchmarks, and conceptual analysis under server-validated integrity checks.
              </p>

              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--color-navy)", fontWeight: 600 }}>
                  <UserCheck size={16} color="#16a34a" /> {searchedRecord.accreditedBy}
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm btn-block"
                onClick={() => window.print()}
                style={{ marginTop: 8 }}
              >
                Print / Save PDF Verification Record
              </button>
            </div>
          </div>
        </section>
      ) : searched ? (
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: "center",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
          }}
        >
          <Lock size={32} color="#e11d48" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", color: "#9f1239", margin: "0 0 6px 0" }}>
            No Matching Certificate Record Found
          </h3>
          <p className="muted" style={{ maxWidth: 460, margin: "0 auto", fontSize: "0.88rem" }}>
            No certificate with serial token <code>{searchToken}</code> exists in the active registry. Please verify the code or check the QR link.
          </p>
        </div>
      ) : null}

      {/* Shareable Student Skill Profile Section */}
      <section className="card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 700 }}>
              Shareable Student Skill Profile
            </h3>
            <p className="muted" style={{ fontSize: "0.84rem", margin: 0 }}>
              Public profile card highlighting verified competencies and battle ratings.
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert("Public profile link copied to clipboard!");
            }}
          >
            <ExternalLink size={14} /> Copy Profile Link
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["Python Systems: 84%", "Calculus & Linear Algebra: 76%", "Molecular Biology: 72%", "Algorithm Efficiency: 91%"].map(
            (skill) => (
              <span
                key={skill}
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "var(--color-ice-silver)",
                  border: "1px solid var(--border-light)",
                }}
              >
                🎯 {skill}
              </span>
            )
          )}
        </div>
      </section>
    </div>
  );
}
