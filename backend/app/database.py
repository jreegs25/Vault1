import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vault.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS matches (
            match_id        TEXT PRIMARY KEY,
            tinder_user_id  TEXT NOT NULL,
            name            TEXT NOT NULL,
            age             INTEGER,
            bio             TEXT,
            photos          TEXT DEFAULT '[]',
            matched_at      TEXT NOT NULL,
            last_message_at TEXT,
            last_message_text TEXT,
            is_flagged      INTEGER DEFAULT 0,
            flagged_at      TEXT,
            synced_at       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            message_id  TEXT PRIMARY KEY,
            match_id    TEXT NOT NULL REFERENCES matches(match_id),
            sender      TEXT NOT NULL CHECK(sender IN ('me', 'them')),
            body        TEXT NOT NULL,
            sent_at     TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
        CREATE INDEX IF NOT EXISTS idx_matches_flagged ON matches(is_flagged);
    """)
    conn.commit()
    conn.close()
