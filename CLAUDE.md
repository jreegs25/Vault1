# The Vault — Project Context

## What is this?
A local web app that surfaces dormant Tinder matches in a swipeable card format,
letting you flag matches for follow-up and send messages without leaving the app.

## Stack
- **Backend:** Python 3.11+ / FastAPI / SQLite
- **Frontend:** React (Vite) / react-tinder-card for swipe gestures
- **Database:** SQLite via Python's built-in `sqlite3` (no ORM — keep it simple)

## Project Structure
```
backend/          # FastAPI server
  app/
    main.py       # FastAPI app + CORS
    database.py   # SQLite connection and schema init
    models.py     # Pydantic models for request/response
    routes/       # Route modules (matches, followups, sync)
    seed.py       # Mock data seeder for development
frontend/         # React app (Vite)
  src/
    components/   # Shared UI components
    views/        # Vault and FollowUps views
    api.js        # API client functions
```

## Key Conventions
- Backend runs on `localhost:8000`, frontend on `localhost:5173` (Vite default)
- All API routes prefixed with `/api`
- Tinder API integration is deferred — V1 uses mock/seeded data
- SQLite DB file lives at `backend/vault.db`
- No ORM — raw SQL queries for simplicity and control

## API Endpoints
- `GET  /api/matches` — paginated matches (reverse-chron, no-messages-first)
- `GET  /api/matches/{id}` — single match with conversation
- `POST /api/matches/{id}/message` — send a message
- `POST /api/matches/{id}/flag` — add to Follow-Ups
- `DELETE /api/followups/{id}` — remove from Follow-Ups
- `POST /api/sync` — trigger data sync (mock in V1)

## Running the App
```bash
# Backend
cd backend && pip install -r requirements.txt && python -m app.main

# Frontend
cd frontend && npm install && npm run dev
```
