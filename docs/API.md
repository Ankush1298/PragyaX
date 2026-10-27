# PragyaX API

Base URL: `http://localhost:8000/api` · Interactive docs: `http://localhost:8000/docs`

Auth: send `Authorization: Bearer <token>` (returned by register/login). Every route except
health, register and login requires it. Errors are JSON: `{"detail": "..."}` (422 validation
errors carry a list of `{loc, msg}` objects).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | Status, DB mode, active AI provider (`ai_is_mock`) |
| POST | `/auth/register` | – | `{name, email, password}` → `201 {token, user}`. 400 on invalid/duplicate email or short password |
| POST | `/auth/login` | – | `{email, password}` → `{token, user}`. 401 on bad credentials |
| GET | `/auth/me` | ✓ | Current user profile |
| POST | `/auth/logout` | ✓ | Deletes the session token server-side |
| GET | `/subjects` | ✓ | All subjects + `selected_subject_id` |
| POST | `/subjects/select` | ✓ | `{subject_id}`. 400 for "Coming Soon" subjects, 404 unknown |
| POST | `/chat/message` | ✓ | `{message, subject?}` → assistant reply + `suggested_followups`, `is_mock` |
| GET | `/chat/history` | ✓ | Latest 50 messages of **this user** (oldest first) |
| GET | `/assessments/questions?subject_id=subj_python` | ✓ | Exactly 5 questions. **No correct answers or explanations** |
| POST | `/assessments/submit` | ✓ | `{subject_id, answers: {question_id: "A"-"D"}}`. Must answer all 5; unknown IDs and invalid options → 400. Graded on the server from the DB answer key; attempt saved |
| GET | `/assessments/history` | ✓ | This user's saved attempts (newest first) |
| GET | `/assessments/{attempt_id}` | ✓ | Full breakdown. 404 if the attempt belongs to someone else |
| GET | `/dashboard` | ✓ | Profile, selected subject, metrics derived from stored rows, recommendations, recent attempts, badges |
| GET | `/challenges/daily` | ✓ | Today's challenge; answer hidden until the user has submitted |
| POST | `/challenges/submit` | ✓ | `{challenge_id, selected_option}`. One submission per user; points awarded once |

## Evaluation rules (deterministic)
- Score = number of answers matching the backend answer key (case-insensitive), out of 5.
- Percentage = score / 5 × 100.
- Proficiency: **0–2 → Beginner, 3–4 → Intermediate, 5 → Advanced** (`ai/mock_provider.py::proficiency_for`).
- Recommended topics: one per missed question, in question order; perfect score → advanced topics.
- Badges: "Python Virtuoso" for a score ≥ 4/5; "Daily Code Breaker" for solving the daily challenge.
