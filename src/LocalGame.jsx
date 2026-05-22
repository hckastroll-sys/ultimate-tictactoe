import { useState } from "react";
import GameUI from "./GameUI";
import { emptyGame, applyMove, calcScores } from "./gameLogic";
import { DEFAULT_RULES } from "./rules";

export default function LocalGame({ onBack }) {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("uttt-theme") || "chalkboard");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [names, setNames] = useState({ X: "X", O: "O" });

  function handleThemeChange(key) {
    setThemeKey(key);
    localStorage.setItem("uttt-theme", key);
  }

  function makeMove(mb, c) {
    const result = applyMove(game, mb, c, rules);
    if (!result) return;
    if (result.gameEnded) {
      const s = calcScores(result.newGame.cells, rules);
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
      rules={rules}
      onRulesChange={setRules}
      canEditRules={true}
      names={names}
      onNameChange={(player, name) => setNames(prev => ({ ...prev, [player]: name }))}
      canEditNames={{ X: true, O: true }}
      onBack={onBack}
    />
  );
}
