"""
Seed the database with mock matches and messages for development.
Run from the backend directory: python -m app.seed
"""

import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from .database import get_connection, init_db

FIRST_NAMES = [
    "Emma", "Olivia", "Ava", "Sophia", "Isabella",
    "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
    "Luna", "Camila", "Aria", "Scarlett", "Penelope",
    "Layla", "Chloe", "Victoria", "Madison", "Eleanor",
    "Grace", "Nora", "Riley", "Zoey", "Hannah",
]

BIOS = [
    "Coffee enthusiast. Dog mom. Hiking on weekends.",
    "New to the city — show me the best tacos.",
    "Probably taller than you in heels 👠",
    "Looking for someone to watch bad movies with.",
    "Plant lady. Yoga. Brunch is a personality trait.",
    "Sarcasm is my love language.",
    "Travel addict — 23 countries and counting.",
    "Here because my friends made me download this.",
    "Nurse by day, Netflix by night.",
    "If you can make me laugh, you're already winning.",
    "Bookworm. Wine lover. Ask me about my cat.",
    "Just moved here from Chicago. Need friends first, honestly.",
    "Fluent in memes and movie quotes.",
    "Looking for a gym buddy who also likes pizza.",
    "Spontaneous road trips > planned vacations.",
]

PHOTO_PLACEHOLDERS = [
    "https://placekitten.com/400/600",
    "https://placekitten.com/401/600",
    "https://placekitten.com/402/600",
    "https://placekitten.com/400/601",
]

OPENER_MESSAGES = [
    "Hey! How's your week going?",
    "That hiking photo is amazing — where was that?",
    "Fellow coffee snob here. What's your go-to order?",
    "Your bio made me laugh — had to swipe right.",
    "Ok but what's your controversial food opinion?",
]

REPLY_MESSAGES = [
    "Haha thanks! It's been pretty good, you?",
    "That was in Colorado last summer! Have you been?",
    "Oat milk latte, always. You?",
    "Haha glad it worked 😄",
    "Pineapple absolutely belongs on pizza. Fight me.",
    "What are you up to this weekend?",
    "That's so funny, I was just thinking the same thing",
]


def _random_past(max_days: int = 90) -> str:
    delta = timedelta(days=random.randint(1, max_days), hours=random.randint(0, 23))
    return (datetime.now(timezone.utc) - delta).isoformat()


def seed(num_matches: int = 30):
    init_db()
    conn = get_connection()

    # Clear existing data
    conn.execute("DELETE FROM messages")
    conn.execute("DELETE FROM matches")
    conn.commit()

    now = datetime.now(timezone.utc).isoformat()

    for i in range(num_matches):
        match_id = f"match_{uuid.uuid4().hex[:10]}"
        user_id = f"user_{uuid.uuid4().hex[:10]}"
        name = random.choice(FIRST_NAMES)
        age = random.randint(22, 34)
        bio = random.choice(BIOS)
        num_photos = random.randint(2, 4)
        photos = json.dumps(random.sample(PHOTO_PLACEHOLDERS, min(num_photos, len(PHOTO_PLACEHOLDERS))))
        matched_at = _random_past(max_days=120)

        # ~40% have no messages (dormant/untapped), ~60% have a short convo
        has_messages = random.random() > 0.4
        last_message_at = None
        last_message_text = None
        messages = []

        if has_messages:
            num_msgs = random.randint(1, 5)
            msg_time = datetime.fromisoformat(matched_at)
            for j in range(num_msgs):
                msg_time += timedelta(hours=random.randint(1, 48))
                sender = "me" if j % 2 == 0 else "them"
                body = (
                    random.choice(OPENER_MESSAGES) if j == 0
                    else random.choice(REPLY_MESSAGES)
                )
                messages.append({
                    "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                    "match_id": match_id,
                    "sender": sender,
                    "body": body,
                    "sent_at": msg_time.isoformat(),
                })
            last_message_at = messages[-1]["sent_at"]
            last_message_text = messages[-1]["body"]

        # ~10% pre-flagged for follow-ups demo
        is_flagged = 1 if random.random() < 0.1 else 0
        flagged_at = _random_past(max_days=30) if is_flagged else None

        conn.execute(
            """INSERT INTO matches
               (match_id, tinder_user_id, name, age, bio, photos,
                matched_at, last_message_at, last_message_text,
                is_flagged, flagged_at, synced_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (match_id, user_id, name, age, bio, photos,
             matched_at, last_message_at, last_message_text,
             is_flagged, flagged_at, now),
        )

        for msg in messages:
            conn.execute(
                """INSERT INTO messages (message_id, match_id, sender, body, sent_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (msg["message_id"], msg["match_id"], msg["sender"], msg["body"], msg["sent_at"]),
            )

    conn.commit()

    match_count = conn.execute("SELECT COUNT(*) FROM matches").fetchone()[0]
    msg_count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    flagged_count = conn.execute("SELECT COUNT(*) FROM matches WHERE is_flagged = 1").fetchone()[0]
    conn.close()

    print(f"Seeded {match_count} matches, {msg_count} messages, {flagged_count} flagged for follow-up.")


if __name__ == "__main__":
    seed()
