import { NavLink } from "react-router-dom";
import { syncMatches } from "../api";
import { useState } from "react";

export default function Nav() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncMatches();
    setSyncing(false);
  };

  return (
    <nav className="app-nav">
      <div className="nav-brand">The Vault</div>
      <div className="nav-links">
        <NavLink to="/" end>
          Vault
        </NavLink>
        <NavLink to="/followups">Follow-Ups</NavLink>
      </div>
      <button
        className="btn btn-ghost nav-sync"
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? "Syncing..." : "↻ Sync"}
      </button>
    </nav>
  );
}
