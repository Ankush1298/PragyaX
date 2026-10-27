# Demo script (~5 minutes)

**Before the demo:** start the backend and frontend (see README). Optionally delete `pragyax.db` for a clean slate.
Open http://localhost:5173 and http://localhost:8000/docs in two tabs.

1. **Registration**: on "Create account", click submit empty to show validation. Then enter
   name `Asha Sharma`, email `asha@pragyax.demo`, password `demo1234` → *Create account & start learning*.
   Point out the note: passwords hashed, demo-only auth.
2. **Learning Chat**: lands on the chat. Note the **Demo AI** badge. Ask *"What is a list comprehension?"*,
   then click a suggested follow-up chip (*"How does a generator expression differ…"*). Code blocks render.
3. **Subject selection**: *Next: choose subject*. Show Python is active and the others say **Coming soon**
   (disabled). Click *Select subject* on Python → saved → *Start assessment*.
4. **Assessment**: walk the step indicator. Answer **B, C, A, B, A** (Q3 wrong on purpose).
   Show the *Review* step, then *Submit for evaluation*.
5. **Evaluation**: result page shows **4/5 · 80% · Intermediate**, the **Mock Evaluation** badge,
   per-question correct/incorrect with explanations, and a recommendation for the missed topic (dictionaries/hashing).
6. **Saved results**: *My Results* lists the attempt. **Persistence proof:** stop the backend (Ctrl+C),
   start it again, refresh. The result is still there.
7. **Dashboard**: *Go to dashboard*: latest score 4/5, 1 assessment, questions asked, journey checklist,
   recommended topics "based on your latest assessment", recent history, "Python Virtuoso" badge.
8. **Bonus: Daily Challenge**: pick **B** (`[7, 7, 7]`) → +50 points + "Daily Code Breaker" badge.
   Refresh: it stays completed and can't be re-submitted for more points. Dashboard points = 50.
9. **Security (optional, in /docs)**: call `GET /api/dashboard` without a token → 401.
   `GET /api/assessments/questions` response contains no `correct_option`.

Talking points: everything runs offline; the AI layer and the database are swappable behind interfaces
(`ai/base.py`, `Repository`), and each teammate owns a module (see ARCHITECTURE.md).
