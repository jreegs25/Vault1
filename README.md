# The Vault
## Product Requirements Document
**v1.0 · February 2026**

| | |
|---|---|
| **Status** | Draft |
| **Owner** | Robert |
| **Platform** | Local web app (macOS / Windows) |
| **Stack** | Python backend · SQLite · React frontend |
| **Target release** | V1 MVP — personal use |

---

## 1. Overview

The Vault is a local web application that lets you review, rediscover, and act on dormant Tinder matches. It solves a specific UX failure in the native Tinder app: once a conversation goes quiet, it becomes psychologically easier to swipe new profiles than to re-engage with people you already matched with. The Vault surfaces those dormant matches in a swipeable card format, prompts you to act, and lets you send a message without leaving the app.

The name reflects the core metaphor: your matches don't disappear, they go into the Vault — waiting to be revisited on your terms.

---

## 2. Problem Statement

The Tinder inbox UI is optimized for recency, not relationship potential. This creates three compounding problems:

- Conversations you never started get buried beneath active ones, effectively disappearing from view.
- There's no mechanism to flag a match as "I want to follow up with this person."
- Re-engaging requires scrolling through a long list, which feels like a chore compared to the dopamine loop of swiping new profiles.

The result: genuine connection potential sits untapped in an inbox you rarely open.

---

## 3. Goals

### V1 Goals
- Pull and cache all matches and their conversation status from the Tinder API.
- Present dormant matches as swipeable cards, sorted reverse-chronologically.
- Allow right-swipe to flag a match and optionally send them a message directly from the app.
- Maintain a Follow-Ups section listing all flagged matches for easy re-engagement.
- Run entirely locally — no server, no external data storage, Tinder credentials stay on your machine.

### Future Goals (V2+)
- Affinity-based sorting: score matches by engagement signals (message count, response rate, recency, who sent the last message) to surface highest-potential connections first.
- ML-based ranking: train a lightweight model on your own behavior to predict who you're most likely to actually message.
- Conversation analytics: streaks, response times, message length trends.

---

## 4. Non-Goals

- This is not a replacement for the Tinder app. It is a companion tool for a specific use case.
- No hosted version in V1. The app will not be deployed to the cloud or accessible from mobile.
- No auto-messaging or AI-generated openers in V1.
- No support for other dating apps (Hinge, Bumble) in V1.

---

## 5. Target User

V1 is a personal tool built for a single user. The design should be clean and intentional, but there are no accessibility, internationalization, or multi-user requirements at this stage.

---

## 6. Technical Approach

### Authentication

Tinder uses an unofficial private API. Authentication requires a phone number (SMS OTP flow) or Facebook token to obtain a JWT bearer token. This token is stored locally in a config file and used for all subsequent API requests. The user authenticates once during setup; the token persists until it expires.

> ⚠️ **Important:** This approach uses Tinder's unofficial API, which technically violates their Terms of Service. For personal use only — do not distribute or host publicly. Risk of account action is low for read-mostly usage, but be aware.

### Data Layer

A Python backend handles all Tinder API communication and stores data in a local SQLite database. Key tables:

- `matches` — match ID, profile data, photo URLs, timestamp matched, last message timestamp
- `messages` — full conversation history per match
- `followups` — matches flagged by the user, with optional notes and flag timestamp

The app syncs with Tinder on launch and on manual refresh. Data is cached locally so the app works even when the API is unavailable.

### Backend

Python with FastAPI exposes a local REST API consumed by the frontend. Key endpoints:

- `GET /matches` — returns matches sorted by selected mode (reverse-chron for V1)
- `GET /matches/{id}` — returns full profile + conversation for a single match
- `POST /matches/{id}/message` — sends a message via the Tinder API
- `POST /matches/{id}/flag` — adds match to Follow-Ups
- `DELETE /followups/{id}` — removes from Follow-Ups
- `POST /sync` — triggers a fresh pull from Tinder

### Frontend

A single-page React app served locally. Two primary views:

- **The Vault** — card stack interface for reviewing dormant matches
- **Follow-Ups** — list view of flagged matches with last message context and a quick-compose button

Swipe gestures handled via a library (e.g., `react-tinder-card` or Framer Motion). The app runs in a browser tab at `localhost:3000` when the Python server is active.

---

## 7. Feature Specifications

### 7.1 The Vault — Card Review Mode

**Entry**

The home screen shows a single button or card stack prompt to enter The Vault, plus a counter showing how many matches are waiting (e.g., "47 in the Vault"). Matches with zero messages are shown first within the reverse-chronological sort, since those represent the most untapped potential.

**Card contents**

Each card displays: profile photo (full-bleed, swipeable), name and age, distance, bio excerpt, last message (or "No messages yet" if conversation was never started), and how long ago the match occurred.

**Swipe left**

Match stays in the queue. No action taken. User moves to the next card. This is a "not now" gesture, not a permanent decision.

**Swipe right**

Two things happen: (1) the match is added to Follow-Ups and flagged in the local database, and (2) a compose sheet slides up immediately, showing the match's name and photo, with a text input to write and send a message. Sending is optional — the user can dismiss the compose sheet and the flag is still saved.

**Session end**

When the user has reviewed all cards in the current session (or manually exits), a summary screen shows: cards reviewed, matches flagged, messages sent. Option to reshuffle or exit.

---

### 7.2 Follow-Ups

**Overview**

A persistent section accessible from the nav. Lists all flagged matches in reverse order of when they were flagged. Each row shows: photo thumbnail, name, last message snippet, time since last message, and a "Message" button.

**Quick compose**

Tapping "Message" on any Follow-Up opens a compose sheet inline. Message is sent via the Tinder API. On success, the last message field updates in real time.

**Remove from Follow-Ups**

A swipe-left or X button removes the match from Follow-Ups (unflag). The match remains in The Vault for future review sessions.

---

### 7.3 Sync

On app launch, the backend automatically syncs new matches and new messages from Tinder. A manual "Refresh" button in the nav triggers a fresh sync on demand. Sync status (last synced timestamp) is shown in the UI.

---

## 8. Data Model

Core SQLite schema. Claude Code can generate the actual migration files from this spec.

### `matches`

| Field | Type | Description |
|---|---|---|
| `match_id` | TEXT PK | Tinder's unique match identifier |
| `tinder_user_id` | TEXT | The other person's Tinder user ID |
| `name` | TEXT | Display name |
| `age` | INTEGER | Age from profile |
| `bio` | TEXT | Profile bio |
| `photos` | JSON | Array of photo URLs |
| `matched_at` | TIMESTAMP | When the match occurred |
| `last_message_at` | TIMESTAMP | Timestamp of most recent message (null if none) |
| `last_message_text` | TEXT | Preview of most recent message |
| `is_flagged` | BOOLEAN | Whether added to Follow-Ups |
| `flagged_at` | TIMESTAMP | When it was flagged (null if not flagged) |
| `synced_at` | TIMESTAMP | Last time this record was updated from API |

### `messages`

| Field | Type | Description |
|---|---|---|
| `message_id` | TEXT PK | Tinder's message ID |
| `match_id` | TEXT FK | Reference to matches table |
| `sender` | TEXT | "me" or "them" |
| `body` | TEXT | Message content |
| `sent_at` | TIMESTAMP | When the message was sent |

---

## 9. V2 Roadmap — Affinity Sorting

V2 replaces reverse-chronological ordering with an affinity score that predicts which matches have the highest potential for re-engagement. The data model above already captures the signals needed — no schema changes required.

### Scoring signals (rule-based V2)

- **Message count** — more messages = higher baseline affinity
- **Who sent the last message** — if they messaged you last, higher urgency score
- **Response rate** — ratio of their replies to your messages
- **Recency** — matches from the last 30 days weighted higher
- **Time since last activity** — penalize very stale matches slightly

### ML-based V3

Once you've used the app for a few weeks, your own behavior (who you actually messaged, who you skipped repeatedly) becomes training data. A lightweight logistic regression or gradient boosted model can learn your personal engagement patterns. Small dataset, but manageable with scikit-learn. Claude Code can help build this when you're ready.

---

## 10. Setup Instructions for Claude Code

When you open Claude Code, share this PRD and use this starter prompt:

> *"I want to build a local web app called The Vault. I have a PRD — please read it carefully, then: (1) set up the project folder structure, (2) create the Python backend with FastAPI and SQLite, (3) scaffold the React frontend with two views: The Vault card stack and Follow-Ups list. Start with the backend and database setup first, then we'll build the frontend together."*

**Notes for your first session:**

- Tell Claude Code you're a beginner — it will explain what it's doing as it goes.
- Ask it to create a `CLAUDE.md` file first with the project context so it remembers the stack and conventions across sessions.
- Work in small increments. Get the backend working and returning mock data before building any UI.
- The Tinder API auth step is the trickiest part. Ask Claude Code to handle that last, after the rest of the app structure is working.

---

## 11. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Tinder API changes break integration | Medium | Pin to known-working API version. Monitor community docs (pynder, tinder-api repos on GitHub). |
| Account ban for ToS violation | Low | Read-only usage is low risk. Avoid aggressive polling. Add rate limiting to sync calls. |
| JWT token expiry | Low | Store token with expiry date. Prompt user to re-authenticate when expired. |
| Large match volume slows UI | Low | Paginate card stack. Load 20 matches at a time, fetch next batch on demand. |

---

*The Vault — PRD v1.0*
