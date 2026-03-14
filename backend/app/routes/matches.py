import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from ..database import get_connection
from ..models import MatchDetail, MatchesPage, MatchOut, MessageOut, SendMessage

router = APIRouter(prefix="/api/matches", tags=["matches"])


def _row_to_match(row) -> MatchOut:
    return MatchOut(
        match_id=row["match_id"],
        tinder_user_id=row["tinder_user_id"],
        name=row["name"],
        age=row["age"],
        bio=row["bio"],
        photos=json.loads(row["photos"]) if row["photos"] else [],
        matched_at=row["matched_at"],
        last_message_at=row["last_message_at"],
        last_message_text=row["last_message_text"],
        is_flagged=bool(row["is_flagged"]),
        flagged_at=row["flagged_at"],
    )


@router.get("", response_model=MatchesPage)
def list_matches(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100)):
    """
    Returns matches sorted reverse-chronologically,
    with no-message matches surfaced first (highest untapped potential).
    """
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM matches").fetchone()[0]
    offset = (page - 1) * per_page
    rows = conn.execute(
        """
        SELECT * FROM matches
        ORDER BY
            CASE WHEN last_message_at IS NULL THEN 0 ELSE 1 END,
            matched_at DESC
        LIMIT ? OFFSET ?
        """,
        (per_page, offset),
    ).fetchall()
    conn.close()
    return MatchesPage(
        matches=[_row_to_match(r) for r in rows],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{match_id}", response_model=MatchDetail)
def get_match(match_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM matches WHERE match_id = ?", (match_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Match not found")

    msg_rows = conn.execute(
        "SELECT * FROM messages WHERE match_id = ? ORDER BY sent_at ASC",
        (match_id,),
    ).fetchall()
    conn.close()

    match = _row_to_match(row)
    messages = [
        MessageOut(
            message_id=m["message_id"],
            match_id=m["match_id"],
            sender=m["sender"],
            body=m["body"],
            sent_at=m["sent_at"],
        )
        for m in msg_rows
    ]
    return MatchDetail(**match.model_dump(), messages=messages)


@router.post("/{match_id}/flag")
def flag_match(match_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM matches WHERE match_id = ?", (match_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "UPDATE matches SET is_flagged = 1, flagged_at = ? WHERE match_id = ?",
        (now, match_id),
    )
    conn.commit()
    conn.close()
    return {"status": "flagged", "match_id": match_id, "flagged_at": now}


@router.post("/{match_id}/message")
def send_message(match_id: str, payload: SendMessage):
    conn = get_connection()
    row = conn.execute("SELECT * FROM matches WHERE match_id = ?", (match_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc).isoformat()
    message_id = f"msg_{uuid.uuid4().hex[:12]}"

    # In V1, we just store locally. Real Tinder API send comes later.
    conn.execute(
        "INSERT INTO messages (message_id, match_id, sender, body, sent_at) VALUES (?, ?, ?, ?, ?)",
        (message_id, match_id, "me", payload.body, now),
    )
    conn.execute(
        "UPDATE matches SET last_message_at = ?, last_message_text = ? WHERE match_id = ?",
        (now, payload.body, match_id),
    )
    conn.commit()
    conn.close()
    return {"status": "sent", "message_id": message_id, "sent_at": now}
