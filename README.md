# PragyaX — AI-Powered Gamified Learning: From Theory to Practice

Hackathon prototype. A learner registers, studies with a learning chat, picks a subject, takes a
5-question assessment, gets an evaluated result that is saved, and sees real progress on a dashboard.

**Runs fully offline:** SQLite persistence + a deterministic **Mock AI**. No Supabase project or paid AI key needed.

```
Registration → Learning Chat → Subject Selection → 5-Question Assessment → Mock Evaluation → Saved Results → Dashboard
```
Extra (Ankush): one Python **Daily Challenge** with one-time points and a badge.

---

## Quick start (macOS / Linux)

Requirements: Python 3.11+ (tested with 3.14), Node 18+ (tested with 26).

**Terminal 1: backend** (from the repo root)
```bash
python3 -m venv .venv                       # skip if .venv already exists
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn backend.app.main:app --reload --port 8000
```
API: http://localhost:8000 · Swagger docs: http://localhost:8000/docs

**Terminal 2: frontend**
```bash
cd frontend
npm install                                 # skip if node_modules already exists
npm run dev
```
App: http://localhost:5173 (Vite proxies `/api` to the backend.)

### Port 8000 already in use?
Run the backend on another port and point the proxy at it:
```bash
.venv/bin/uvicorn backend.app.main:app --reload --port 8001
cd frontend && VITE_BACKEND_URL=http://127.0.0.1:8001 npm run dev
```

### Tests & build
```bash
.venv/bin/python -m pytest backend/tests -q     # 19 API tests (uses a temp DB, not pragyax.db)
cd frontend && npm run build                    # tsc typecheck + production build
```

### Reset demo data
Stop the backend and delete `pragyax.db` in the repo root. It is recreated and re-seeded on next start.

---

## Project layout

```
PragyaX/
├── ai/                    # Ekansh: pluggable AI providers (base, mock, real scaffold, factory)
├── backend/               # Arsh: FastAPI app
│   ├── app/
│   │   ├── main.py        # app, CORS, router mounting
│   │   ├── config.py      # settings + tiny .env loader
│   │   ├── routers/       # health, auth, subjects, chat, assessments, dashboard, challenges
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # password hashing, session auth dependency
│   │   └── database/      # Nagin: SQLite connection + Repository (swap point for Supabase)
│   └── tests/             # end-to-end API tests
├── database/              # Nagin: Postgres/Supabase schema.sql, seed.sql, guide
├── frontend/              # Shoeb: React + Vite + TypeScript
│   └── src/
│       ├── api/           # typed API client + types mirroring backend schemas
│       ├── components/    # Layout, Markdown, loading/error/empty states
│       └── pages/         # Auth, Dashboard, Chat, Subjects, Assessment, Result, History, Challenge
├── docs/                  # API, architecture, demo script
├── .env.example           # all env vars (placeholders only)
└── pragyax.db             # created at runtime (git-ignored)
```

## Documentation
- [docs/API.md](docs/API.md): REST route summary
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): architecture, team module boundaries, limitations, next tasks
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): step-by-step demo
- [database/supabase_guide.md](database/supabase_guide.md): moving to Supabase
- [.env.example](.env.example): environment variable reference

## Honest status
- **Demo auth is not production-ready:** PBKDF2-hashed passwords and random bearer tokens stored in SQLite; no rate limiting, refresh or password reset.
- **AI is mocked:** chat is a deterministic topic lookup; evaluation is server-side answer-key grading with fixed thresholds. The UI labels both ("Demo AI", "Mock Evaluation").
- **Supabase is not connected:** schema and guide are ready, but the running app uses SQLite.
