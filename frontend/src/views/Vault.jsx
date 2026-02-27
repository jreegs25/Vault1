import { useState, useEffect, useRef } from "react";
import TinderCard from "react-tinder-card";
import ComposeSheet from "../components/ComposeSheet";
import { getMatches, flagMatch } from "../api";

export default function Vault() {
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [stats, setStats] = useState({ reviewed: 0, flagged: 0, sent: 0 });
  const [composeMatch, setComposeMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const cardRefs = useRef([]);

  useEffect(() => {
    getMatches(1, 50).then((data) => {
      setMatches(data.matches);
      setCurrentIndex(data.matches.length - 1);
      cardRefs.current = data.matches.map(() => null);
      setLoading(false);
    });
  }, []);

  const swiped = async (direction, match, index) => {
    setStats((s) => ({ ...s, reviewed: s.reviewed + 1 }));

    if (direction === "right") {
      await flagMatch(match.match_id);
      setStats((s) => ({ ...s, flagged: s.flagged + 1 }));
      setComposeMatch(match);
    }

    setCurrentIndex(index - 1);
    if (index - 1 < 0) {
      setDone(true);
    }
  };

  const onMessageSent = () => {
    setStats((s) => ({ ...s, sent: s.sent + 1 }));
    setComposeMatch(null);
  };

  const resetSession = () => {
    setDone(false);
    setLoading(true);
    setStats({ reviewed: 0, flagged: 0, sent: 0 });
    getMatches(1, 50).then((data) => {
      setMatches(data.matches);
      setCurrentIndex(data.matches.length - 1);
      setLoading(false);
    });
  };

  if (loading) return <div className="vault-loading">Loading The Vault...</div>;

  if (done) {
    return (
      <div className="vault-done">
        <h2>Session Complete</h2>
        <div className="vault-stats">
          <div><span className="stat-num">{stats.reviewed}</span> reviewed</div>
          <div><span className="stat-num">{stats.flagged}</span> flagged</div>
          <div><span className="stat-num">{stats.sent}</span> messages sent</div>
        </div>
        <button className="btn btn-primary" onClick={resetSession}>
          Reshuffle &amp; Go Again
        </button>
      </div>
    );
  }

  return (
    <div className="vault-container">
      <div className="vault-header">
        <h1>The Vault</h1>
        <span className="vault-counter">{currentIndex + 1} remaining</span>
      </div>

      <div className="card-stack">
        {matches.map((match, index) => (
          <TinderCard
            ref={(el) => (cardRefs.current[index] = el)}
            key={match.match_id}
            onSwipe={(dir) => swiped(dir, match, index)}
            preventSwipe={["up", "down"]}
            className="swipe-card-wrapper"
          >
            <div
              className="match-card"
              style={{
                backgroundImage: `url(${match.photos[0] || ""})`,
              }}
            >
              <div className="card-overlay">
                <h2>
                  {match.name}, {match.age}
                </h2>
                <p className="card-bio">{match.bio}</p>
                <p className="card-message">
                  {match.last_message_text || "No messages yet"}
                </p>
                <span className="card-time">
                  Matched {timeAgo(match.matched_at)}
                </span>
              </div>
            </div>
          </TinderCard>
        ))}
      </div>

      <div className="swipe-hints">
        <span>← Skip</span>
        <span>Follow Up →</span>
      </div>

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
