# SherlockBot Backend (FastAPI + SQLite + Gemini AI)

This is the backend for your Police OS dashboard. It runs **entirely on your
own machine** — the database is a local SQLite file, no cloud database or
server needed. The only external call it makes is to Google's Gemini API for
the AI features (Sherlock AI chat + Smart Scan).

## What's inside

```
backend/
├── main.py              # FastAPI app, wires everything together
├── database.py           # SQLite connection (creates sherlock.db automatically)
├── models.py              # Database tables (Officer, Case, MissingPerson, Vehicle, CriminalRecord...)
├── schemas.py             # Request/response validation
├── auth.py                # Login + JWT tokens (bcrypt password hashing)
├── seed_data.py            # Fills the DB with sample data matching your UI mock
├── ai/gemini_service.py    # Gemini API wrapper (chat + image analysis)
├── routers/                # One file per feature: cases, missing-persons, vehicles,
│                            # criminals, dashboard, analytics, ai chat, smart scan
├── requirements.txt
└── .env.example
```

## 1. Prerequisites

- Python 3.10+ installed
- A free Gemini API key: https://aistudio.google.com/apikey

## 2. Setup (run these in the `backend` folder)

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create your local environment file
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Open `.env` and paste in your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
JWT_SECRET_KEY=make-up-any-long-random-string-here
```

## 3. Create the database and load sample data

```bash
python seed_data.py
```

This creates `sherlock.db` right in the backend folder and adds sample
cases, missing persons, vehicles, and criminal records — matching the
locations shown in your dashboard map (Karol Bagh, Rajendra Nagar, etc).

It also creates a demo login:
```
Badge ID: IND-45871
Password: password123
```

## 4. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

- API root: http://localhost:8000
- Interactive API docs (test every endpoint from the browser): http://localhost:8000/docs

Leave this running in its own terminal alongside your `npm run dev` frontend terminal.

## 5. Connect your React frontend

In your frontend, set the API base URL (e.g. in a `frontend/.env`):
```
VITE_API_URL=http://localhost:8000
```

Example login call from React:
```js
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ badge_id: "IND-45871", password: "password123" }),
});
const data = await res.json();
localStorage.setItem("token", data.access_token);
```

Every other endpoint requires that token in the header:
```js
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cases`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
```

## API overview

| Feature | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Dashboard | `GET /api/dashboard/summary`, `GET /api/dashboard/live-locations` |
| Cases | `GET/POST /api/cases`, `GET/PUT/DELETE /api/cases/{id}` |
| Missing Persons | `GET/POST /api/missing-persons`, `GET/PUT/DELETE /api/missing-persons/{id}` |
| Vehicles | `GET/POST /api/vehicles`, `GET/PUT/DELETE /api/vehicles/{id}` |
| Criminal Database | `GET/POST /api/criminals`, `GET/PUT/DELETE /api/criminals/{id}` |
| Analytics | `GET /api/analytics/overview` |
| Sherlock AI chat | `POST /api/ai/chat` — `{ "message": "..." }` |
| Smart Scan (text) | `POST /api/smart-scan/text` — `{ "query": "..." }` |
| Smart Scan (image) | `POST /api/smart-scan/image` — multipart file upload |

All endpoints except `/api/auth/*` and `/`, `/api/health` require the
`Authorization: Bearer <token>` header.

## Important design note on Smart Scan / AI

The AI features are built as **search and summarization assistants**, not as
a biometric facial-recognition identification system. When you upload a
photo to Smart Scan, Gemini describes visible attributes (clothing, rough
age range, visible text, setting) and the app searches your local database
using those attributes — it does **not** claim "this is person X" from a
face. Real biometric identity matching is a much higher-stakes capability
(accuracy, bias, and legal issues) and isn't something to bolt onto a
general-purpose LLM integration. If your project eventually needs that, it
should go through a purpose-built, legally-reviewed system with proper
oversight — not this.

## Troubleshooting

- **"GEMINI_API_KEY is not set"** → check your `.env` file exists and has a real key (not the placeholder).
- **CORS errors in the browser** → make sure `FRONTEND_ORIGIN` in `.env` matches the exact URL your Vite dev server runs on (check the `npm run dev` terminal output).
- **"no such table" errors** → run `python seed_data.py` at least once, or just start `uvicorn` (it auto-creates empty tables too).
- **Reset the database** → stop the server, delete `sherlock.db`, run `python seed_data.py` again.
