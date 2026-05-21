import { useState } from "react";
import GameUI from "./GameUI";
import { emptyGame, applyMove, calcScores } from "./gameLogic";

export default function LocalGame({ onBack }) {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("uttt-theme") || "chalkboard");

  function handleThemeChange(key) {
    setThemeKey(key);
    localStorage.setItem("uttt-theme", key);
  }

  function makeMove(mb, c) {
    const result = applyMove(game, mb, c);
    if (!result) return;
    if (result.gameEnded) {
      const s = calcScores(result.newGame.cells);
      const w = s.xTotal > s.oTotal ? "X" : s.oTotal > s.xTotal ? "O" : "draw";
      setSessionScores(prev => ({ ...prev, [w]: prev[w] + 1 }));
    }
    setLastMove({ mb, c });
    setGame(result.newGame);
  }

  function newGame() {
    setGame(emptyGame());
    setLastMove(null);
    setAnimKey(k => k + 1);
  }

  function resetAll() {
    setGame(emptyGame());
    setSessionScores({ X: 0, O: 0, draw: 0 });
    setLastMove(null);
    setAnimKey(k => k + 1);
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
      onBack={onBack}
    />
  );
}
