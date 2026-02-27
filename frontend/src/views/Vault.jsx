import { useState, useEffect, useRef, useCallback, createRef } from "react";
import TinderCard from "react-tinder-card";
import ComposeSheet from "../components/ComposeSheet";
import { getMatches, flagMatch } from "../api";

export default function Vault() {
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [stats, setStats] = useState({ reviewed: 0, flagged: 0, sent: 0 });
  const [composeMatch, setComposeMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const cardRefs = useRef([]);
  const canSwipe = currentIndex >= 0;

  useEffect(() => {
    getMatches(1, 50)
      .then((data) => {
        setMatches(data.matches);
        setCurrentIndex(data.matches.length - 1);
        cardRefs.current = data.matches.map(() => createRef());
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not connect to backend. Is the server running on port 8000?");
        setLoading(false);
        console.error(err);
      });
  }, []);

  const swipeCard = useCallback(
    (dir) => {
      if (canSwipe && cardRefs.current[currentIndex]?.current) {
        cardRefs.current[currentIndex].current.swipe(dir);
      }
    },
    [canSwipe, currentIndex]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") swipeCard("left");
      if (e.key === "ArrowRight") swipeCard("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [swipeCard]);

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
  if (error) return <div className="vault-loading" style={{ color: "#ff6b6b" }}>{error}</div>;

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
            ref={cardRefs.current[index]}
            key={match.match_id}
            onSwipe={(dir) => swiped(dir, match, index)}
            preventSwipe={["up", "down"]}
            swipeRequirementType="position"
            swipeThreshold={80}
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
