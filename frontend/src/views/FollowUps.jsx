import { useState, useEffect } from "react";
import ComposeSheet from "../components/ComposeSheet";
import { getFollowUps, removeFollowUp } from "../api";

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [composeMatch, setComposeMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFollowUps = () => {
    setLoading(true);
    getFollowUps().then((data) => {
      setFollowUps(data);
      setLoading(false);
    });
  };

  useEffect(loadFollowUps, []);

  const handleRemove = async (matchId) => {
    await removeFollowUp(matchId);
    setFollowUps((prev) => prev.filter((m) => m.match_id !== matchId));
  };

  const onMessageSent = () => {
    setComposeMatch(null);
    loadFollowUps();
  };

  if (loading) return <div className="followups-loading">Loading Follow-Ups...</div>;

  return (
    <div className="followups-container">
      <h1>Follow-Ups</h1>
      {followUps.length === 0 ? (
        <div className="followups-empty">
          <p>No follow-ups yet. Swipe right on matches in The Vault to add them here.</p>
        </div>
      ) : (
        <ul className="followups-list">
          {followUps.map((match) => (
            <li key={match.match_id} className="followup-row">
              <img
                className="followup-photo"
                src={match.photos[0] || ""}
                alt={match.name}
              />
              <div className="followup-info">
                <h3>{match.name}, {match.age}</h3>
                <p className="followup-snippet">
                  {match.last_message_text || "No messages yet"}
                </p>
                <span className="followup-time">
                  {match.last_message_at
                    ? `Last message ${timeAgo(match.last_message_at)}`
                    : `Matched ${timeAgo(match.matched_at)}`}
                </span>
              </div>
              <div className="followup-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setComposeMatch(match)}
                >
                  Message
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleRemove(match.match_id)}
                  title="Remove from Follow-Ups"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {composeMatch && (
        <ComposeSheet
          match={composeMatch}
          onSent={onMessageSent}
          onClose={() => setComposeMatch(null)}
        />
      )}
    </div>
  );
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
