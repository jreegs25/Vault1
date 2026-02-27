import { useState } from "react";
import { sendMessage } from "../api";

export default function ComposeSheet({ match, onSent, onClose }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    await sendMessage(match.match_id, body.trim());
    setSending(false);
    onSent();
  };

  return (
    <div className="compose-backdrop" onClick={onClose}>
      <div className="compose-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="compose-header">
          <img
            src={match.photos[0] || ""}
            alt={match.name}
            className="compose-photo"
          />
          <h3>Message {match.name}</h3>
          <button className="compose-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <textarea
          className="compose-input"
          placeholder={`Say something to ${match.name}...`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          autoFocus
        />
        <button
          className="btn btn-primary compose-send"
          onClick={handleSend}
          disabled={sending || !body.trim()}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
