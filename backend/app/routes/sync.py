from datetime import datetime, timezone

from fastapi import APIRouter

from ..database import get_connection
from ..models import SyncStatus

router = APIRouter(prefix="/api", tags=["sync"])


@router.post("/sync", response_model=SyncStatus)
def sync_matches():
    """
    V1: Returns current DB stats as a mock sync response.
    Real Tinder API integration will replace this in a future version.
    """
    conn = get_connection()
    match_count = conn.execute("SELECT COUNT(*) FROM matches").fetchone()[0]
    msg_count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    conn.close()

    return SyncStatus(
        last_synced_at=datetime.now(timezone.utc).isoformat(),
        matches_synced=match_count,
        messages_synced=msg_count,
    )


@router.get("/sync/status", response_model=SyncStatus)
def sync_status():
    conn = get_connection()
    match_count = conn.execute("SELECT COUNT(*) FROM matches").fetchone()[0]
    msg_count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]

    latest = conn.execute(
        "SELECT MAX(synced_at) as last_sync FROM matches"
    ).fetchone()
    conn.close()

    return SyncStatus(
        last_synced_at=latest["last_sync"] if latest else None,
        matches_synced=match_count,
        messages_synced=msg_count,
    )
