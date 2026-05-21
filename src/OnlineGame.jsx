import { useState, useEffect, useRef } from "react";
import GameUI from "./GameUI";
import { emptyGame, applyMove, calcScores } from "./gameLogic";
import { getSupabase, getPlayerId, isExpired } from "./supabase";

export default function OnlineGame({ gameId, onBack }) {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("uttt-theme") || "chalkboard");
  const [myRole, setMyRole] = useState(null);
  const [status, setStatus] = useState("connecting"); // connecting | waiting | playing | expired | error
  const [copied, setCopied] = useState(false);
  const playerId = getPlayerId();
  const prevGameOver = useRef(false);

  function handleThemeChange(key) {
    setThemeKey(key);
    localStorage.setItem("uttt-theme", key);
  }

  // Load game + claim a player slot
  useEffect(() => {
    const sb = getSupabase();
    let cancelled = false;

    // Set up channel synchronously so cleanup always has a reference
    const channel = sb
      .channel(`game-${gameId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}`,
      }, (payload) => {
        if (cancelled) return;
        const row = payload.new;
        setGame(row.state.game);
        setSessionScores(row.state.sessionScores || { X: 0, O: 0, draw: 0 });
        setLastMove(row.state.lastMove || null);
        const both = !!(row.x_player_id && row.o_player_id);
        setStatus(both ? "playing" : "waiting");
      })
      .subscribe();

    async function loadGame() {
      const { data, error } = await sb
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (cancelled) return;
      if (error || !data) { setStatus("error"); return; }
      if (isExpired(data.created_at)) { setStatus("expired"); return; }

      let role = null;
      if (data.x_player_id === playerId) {
        role = "X";
      } else if (data.o_player_id === playerId) {
        role = "O";
      } else if (!data.o_player_id) {
        const { error: claimErr } = await sb
          .from("games")
          .update({ o_player_id: playerId })
          .eq("id", gameId)
          .is("o_player_id", null);
        if (cancelled) return;
        if (!claimErr) role = "O";
      }

      setMyRole(role);
      setGame(data.state.game);
      setSessionScores(data.state.sessionScores || { X: 0, O: 0, draw: 0 });
      setLastMove(data.state.lastMove || null);
      const bothPresent = !!(data.x_player_id && (data.o_player_id || role === "O"));
      setStatus(bothPresent ? "playing" : "waiting");
    }

    loadGame().catch(err => {
      if (!cancelled) { console.error("loadGame failed:", err); setStatus("error"); }
    });

    return () => { cancelled = true; sb.removeChannel(channel); };
  }, [gameId]);

  // Trigger animation when a new game starts (gameOver flips false after being true)
  useEffect(() => {
    if (prevGameOver.current && !game.gameOver) {
      setAnimKey(k => k + 1);
    }
    prevGameOver.current = game.gameOver;
  }, [game.gameOver]);

  async function pushState(newGame, newSessionScores, newLastMove) {
    await getSupabase().from("games").update({
      state: { game: newGame, sessionScores: newSessionScores, lastMove: newLastMove },
    }).eq("id", gameId);
  }

  function makeMove(mb, c) {
    if (status !== "playing") return;
    if (myRole && game.currentPlayer !== myRole) return;
    const result = applyMove(game, mb, c);
    if (!result) return;

    let newSessionScores = sessionScores;
    if (result.gameEnded) {
      const s = calcScores(result.newGame.cells);
      const w = s.xTotal > s.oTotal ? "X" : s.oTotal > s.xTotal ? "O" : "draw";
      newSessionScores = { ...sessionScores, [w]: sessionScores[w] + 1 };
      setSessionScores(newSessionScores);
    }

    const newLastMove = { mb, c };
    setGame(result.newGame);
    setLastMove(newLastMove);
    pushState(result.newGame, newSessionScores, newLastMove);
  }

  function newGame() {
    const fresh = emptyGame();
    setGame(fresh);
    setLastMove(null);
    pushState(fresh, sessionScores, null);
  }

  function resetAll() {
    const fresh = emptyGame();
    const freshScores = { X: 0, O: 0, draw: 0 };
    setGame(fresh);
    setSessionScores(freshScores);
    setLastMove(null);
    pushState(fresh, freshScores, null);
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?g=${gameId}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (status === "connecting") {
    return <Splash message="Connecting…" />;
  }
  if (status === "expired") {
    return <Splash message="This game has expired." onBack={onBack} />;
  }
  if (status === "error") {
    return <Splash message="Game not found." onBack={onBack} />;
  }

  return (
    <GameUI
      game={game}
      sessionScores={sessionScores}
      lastMove={lastMove}
      animKey={animKey}
      onMove={makeMove}
      onNewGame={newGame}
      onResetAll={resetAll}
      themeKey={themeKey}
      onThemeChange={handleThemeChange}
      myRole={myRole}
      isWaiting={status === "waiting"}
      shareUrl={shareUrl}
      onCopyLink={copyLink}
      onBack={onBack}
    />
  );
}

function Splash({ message, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#182e08", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      fontFamily: "'Special Elite', cursive", color: "rgba(240,235,220,0.78)",
    }}>
      <div style={{ fontSize: "1.1rem" }}>{message}</div>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily: "'Special Elite', cursive", fontSize: "0.88rem",
          color: "rgba(240,235,220,0.78)", background: "transparent",
          border: "1.5px solid rgba(240,235,220,0.4)", padding: "7px 22px",
          cursor: "pointer", borderRadius: "3px",
        }}>Back to Menu</button>
      )}
    </div>
  );
}
