import { useState } from "react";
import { getSupabase, getPlayerId, generateGameId } from "./supabase";
import { emptyGame } from "./gameLogic";
import { DEFAULT_RULES } from "./rules";

export default function Landing({ onLocal, onOnline }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreateGame() {
    setCreating(true);
    setError(null);
    const id = generateGameId();
    const playerId = getPlayerId();
    const { error } = await getSupabase().from("games").insert({
      id,
      state: { game: emptyGame(), sessionScores: { X: 0, O: 0, draw: 0 }, sessionTotalPts: { X: 0, O: 0 }, lastMove: null, rules: DEFAULT_RULES, names: { X: "X", O: "O" } },
      x_player_id: playerId,
    });
    if (error) {
      setError("Failed to create game. Check your connection.");
      setCreating(false);
      return;
    }
    onOnline(id);
  }

  const CHALK = "rgba(240,235,220,0.78)";
  const CHALK_DIM = "rgba(240,235,220,0.25)";

  const btn = {
    fontFamily: "'Special Elite', cursive", fontSize: "1rem", letterSpacing: "0.08em",
    color: CHALK, background: "transparent", border: `1.5px solid ${CHALK}`,
    padding: "12px 36px", cursor: "pointer", borderRadius: "4px", opacity: 0.85,
    transition: "opacity 0.15s", width: "100%", maxWidth: 260,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#182e08",
      backgroundImage: `radial-gradient(ellipse at 15% 10%, rgba(45,85,12,0.45) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 90%, rgba(8,35,4,0.55) 0%, transparent 55%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Special Elite', cursive",
    }}>
      <h1 style={{
        fontFamily: "'Permanent Marker', cursive", color: CHALK,
        fontSize: "clamp(1.6rem, 6vw, 2.4rem)", textAlign: "center",
        lineHeight: 1.2, letterSpacing: "0.05em",
        textShadow: "2px 2px 10px rgba(0,0,0,0.5)", marginBottom: 8, opacity: 0.88,
      }}>
        Ultimate<br />Tic-Tac-Toe
      </h1>

      <p style={{ color: CHALK_DIM, fontSize: "0.85rem", marginBottom: 36, letterSpacing: "0.04em" }}>
        Choose how to play
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", padding: "0 24px" }}>
        <button onClick={onLocal} style={btn}>
          Play Local
          <div style={{ fontSize: "0.7rem", opacity: 0.55, marginTop: 2 }}>Pass &amp; play on one device</div>
        </button>

        <button onClick={handleCreateGame} disabled={creating} style={{ ...btn, opacity: creating ? 0.4 : 0.85 }}>
          {creating ? "Creating…" : "Play Online"}
          <div style={{ fontSize: "0.7rem", opacity: 0.55, marginTop: 2 }}>Share a link with a friend</div>
        </button>

        {error && <div style={{ color: "#ff8c42", fontSize: "0.78rem", marginTop: 4 }}>{error}</div>}
      </div>
    </div>
  );
}
