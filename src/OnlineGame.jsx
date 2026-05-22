import { useState, useEffect, useRef } from "react";
import GameUI from "./GameUI";
import { emptyGame, applyMove, calcScores } from "./gameLogic";
import { getSupabase, getPlayerId, isExpired } from "./supabase";
import { DEFAULT_RULES } from "./rules";

export default function OnlineGame({ gameId, onBack }) {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("uttt-theme") || "chalkboard");
  const [myRole, setMyRole] = useState(null);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [names, setNames] = useState({ X: "X", O: "O" });
  const [sessionWinner, setSessionWinner] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(null);
  const swapFlagRef = useRef(false);
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
        setRules(row.state.rules || DEFAULT_RULES);
        setNames(row.state.names || { X: "X", O: "O" });
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
      setRules(data.state.rules || DEFAULT_RULES);
      setNames(data.state.names || { X: "X", O: "O" });
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

  // Keep timeout handler fresh on every render so it always sees latest state
  useEffect(() => {
    onTimeoutRef.current = (capturedPlayer) => {
      if (game.gameOver || game.currentPlayer !== capturedPlayer) return;
      if (myRole && game.currentPlayer !== myRole) return;
      const newGame = {
        ...game,
        currentPlayer: game.currentPlayer === "X" ? "O" : "X",
        activeBoard: null,
      };
      setGame(newGame);
      pushState(newGame, sessionScores, lastMove, rules, names);
    };
  });

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!rules.timeLimit || game.gameOver || !lastMove) { setTimeLeft(null); return; }
    const capturedPlayer = game.currentPlayer;
    let t = rules.timeLimit;
    setTimeLeft(t);
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        onTimeoutRef.current?.(capturedPlayer);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [game.currentPlayer, game.gameOver, rules.timeLimit, !!lastMove]);

  async function pushState(newGame, newSessionScores, newLastMove, newRules, newNames) {
    await getSupabase().from("games").update({
      state: { game: newGame, sessionScores: newSessionScores, lastMove: newLastMove, rules: newRules, names: newNames },
    }).eq("id", gameId);
  }

  function makeMove(mb, c) {
    if (status !== "playing") return;
    if (myRole && game.currentPlayer !== myRole) return;
    const result = applyMove(game, mb, c, rules);
    if (!result) return;

    let newSessionScores = sessionScores;
    if (result.gameEnded) {
      const s = calcScores(result.newGame.cells, rules, result.newGame.megaOwners);
      const w = s.xTotal > s.oTotal ? "X" : s.oTotal > s.xTotal ? "O" : "draw";
      newSessionScores = { ...sessionScores, [w]: sessionScores[w] + 1 };
      setSessionScores(newSessionScores);
      if (rules.firstToN && w !== "draw" && newSessionScores[w] >= rules.firstToN) {
        setSessionWinner(w);
      }
    }

    const newLastMove = { mb, c };
    setGame(result.newGame);
    setLastMove(newLastMove);
    pushState(result.newGame, newSessionScores, newLastMove, rules, names);
  }

  function newGame() {
    let starter = "X";
    if (rules.swapSides) {
      swapFlagRef.current = !swapFlagRef.current;
      starter = swapFlagRef.current ? "O" : "X";
    }
    const fresh = emptyGame(starter);
    setGame(fresh);
    setLastMove(null);
    setSessionWinner(null);
    pushState(fresh, sessionScores, null, rules, names);
  }

  function resetAll() {
    swapFlagRef.current = false;
    const fresh = emptyGame();
    const freshScores = { X: 0, O: 0, draw: 0 };
    setGame(fresh);
    setSessionScores(freshScores);
    setSessionWinner(null);
    setLastMove(null);
    pushState(fresh, freshScores, null, rules, names);
  }

  function handleRulesChange(newRules) {
    setRules(newRules);
    pushState(game, sessionScores, lastMove, newRules, names);
  }

  function handleNameChange(player, name) {
    const newNames = { ...names, [player]: name };
    setNames(newNames);
    pushState(game, sessionScores, lastMove, rules, newNames);
  }

  const shareUrl = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}${window.location.pathname}?g=${gameId}`;

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

  const gameInProgress = lastMove !== null && !game.gameOver;

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
      sessionWinner={sessionWinner}
      myRole={myRole}
      isWaiting={status === "waiting"}
      shareUrl={shareUrl}
      onCopyLink={copyLink}
      rules={rules}
      onRulesChange={handleRulesChange}
      canEditRules={myRole === "X"}
      gameInProgress={gameInProgress}
      names={names}
      onNameChange={handleNameChange}
      canEditNames={{ X: myRole === "X", O: myRole === "O" }}
      timeLeft={timeLeft}
      onBack={onBack}
    />
  );
}

function Splash({ message, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#182e08", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      fontFamily: "system-ui, sans-serif", color: "rgba(240,235,220,0.9)",
    }}>
      <div style={{ fontSize: "1.2rem", letterSpacing: "0.04em" }}>{message}</div>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily: "system-ui, sans-serif", fontSize: "0.9rem",
          color: "rgba(240,235,220,0.9)", background: "transparent",
          border: "1.5px solid rgba(240,235,220,0.5)", padding: "8px 24px",
          cursor: "pointer", borderRadius: "3px",
        }}>Back to Menu</button>
      )}
    </div>
  );
}
