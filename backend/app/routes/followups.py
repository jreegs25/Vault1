import json

from fastapi import APIRouter, HTTPException

from ..database import get_connection
from ..models import MatchOut

router = APIRouter(prefix="/api/followups", tags=["followups"])


@router.get("", response_model=list[MatchOut])
def list_followups():
    """Returns all flagged matches, most recently flagged first."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM matches WHERE is_flagged = 1 ORDER BY flagged_at DESC"
    ).fetchall()
    conn.close()
    return [
        MatchOut(
            match_id=r["match_id"],
            tinder_user_id=r["tinder_user_id"],
            name=r["name"],
            age=r["age"],
            bio=r["bio"],
            photos=json.loads(r["photos"]) if r["photos"] else [],
            matched_at=r["matched_at"],
            last_message_at=r["last_message_at"],
            last_message_text=r["last_message_text"],
            is_flagged=bool(r["is_flagged"]),
            flagged_at=r["flagged_at"],
        )
        for r in rows
    ]


@router.delete("/{match_id}")
def remove_followup(match_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM matches WHERE match_id = ?", (match_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Match not found")

    conn.execute(
        "UPDATE matches SET is_flagged = 0, flagged_at = NULL WHERE match_id = ?",
        (match_id,),
    )
    conn.commit()
    conn.close()
    return {"status": "unflagged", "match_id": match_id}
