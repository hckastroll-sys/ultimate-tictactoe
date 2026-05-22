import { useState, useEffect, useRef } from "react";
import GameUI from "./GameUI";
import { emptyGame, applyMove, calcScores } from "./gameLogic";
import { DEFAULT_RULES } from "./rules";

export default function LocalGame({ onBack }) {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [sessionWinner, setSessionWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("uttt-theme") || "chalkboard");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [names, setNames] = useState({ X: "X", O: "O" });
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const swapFlagRef = useRef(false); // tracks alternating starter for swapSides

  function handleThemeChange(key) {
    setThemeKey(key);
    localStorage.setItem("uttt-theme", key);
  }

  // Timer: starts after the first move (lastMove non-null), resets each turn
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
        setGame(g => {
          if (g.gameOver || g.currentPlayer !== capturedPlayer) return g;
          return { ...g, currentPlayer: g.currentPlayer === "X" ? "O" : "X", activeBoard: null };
        });
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [game.currentPlayer, game.gameOver, rules.timeLimit, !!lastMove]);

  function makeMove(mb, c) {
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

    setLastMove({ mb, c });
    setGame(result.newGame);
  }

  function newGame() {
    let starter = "X";
    if (rules.swapSides) {
      swapFlagRef.current = !swapFlagRef.current;
      starter = swapFlagRef.current ? "O" : "X";
    }
    setGame(emptyGame(starter));
    setLastMove(null);
    setSessionWinner(null);
    setAnimKey(k => k + 1);
  }

  function resetAll() {
    swapFlagRef.current = false;
    setGame(emptyGame());
    setSessionScores({ X: 0, O: 0, draw: 0 });
    setSessionWinner(null);
    setLastMove(null);
    setAnimKey(k => k + 1);
  }

  const gameInProgress = lastMove !== null && !game.gameOver;

  return (
    <GameUI
      game={game}
      sessionScores={sessionScores}
      sessionWinner={sessionWinner}
      lastMove={lastMove}
      animKey={animKey}
      onMove={makeMove}
      onNewGame={newGame}
      onResetAll={resetAll}
      themeKey={themeKey}
      onThemeChange={handleThemeChange}
      rules={rules}
      onRulesChange={setRules}
      canEditRules={true}
      gameInProgress={gameInProgress}
      names={names}
      onNameChange={(player, name) => setNames(prev => ({ ...prev, [player]: name }))}
      canEditNames={{ X: true, O: true }}
      timeLeft={timeLeft}
      onBack={onBack}
    />
  );
}
