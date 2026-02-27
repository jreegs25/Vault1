from pydantic import BaseModel
from typing import Optional


class MatchOut(BaseModel):
    match_id: str
    tinder_user_id: str
    name: str
    age: Optional[int] = None
    bio: Optional[str] = None
    photos: list[str] = []
    matched_at: str
    last_message_at: Optional[str] = None
    last_message_text: Optional[str] = None
    is_flagged: bool = False
    flagged_at: Optional[str] = None

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    message_id: str
    match_id: str
    sender: str
    body: str
    sent_at: str


class MatchDetail(MatchOut):
    messages: list[MessageOut] = []


class SendMessage(BaseModel):
    body: str


class MatchesPage(BaseModel):
    matches: list[MatchOut]
    total: int
    page: int
    per_page: int


class SyncStatus(BaseModel):
    last_synced_at: Optional[str] = None
    matches_synced: int = 0
    messages_synced: int = 0
