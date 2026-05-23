import { useState, useEffect, useRef } from "react";
import GameUI from "./GameUI";
import { emptyGame, applyMove, calcScores } from "./gameLogic";
import { DEFAULT_RULES } from "./rules";

export default function LocalGame({ onBack }) {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [sessionTotalPts, setSessionTotalPts] = useState({ X: 0, O: 0 });
  const [sessionWinner, setSessionWinner] = useState(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [sessionTimerActive, setSessionTimerActive] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("uttt-theme") || "chalkboard");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [names, setNames] = useState({ X: "X", O: "O" });
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const swapFlagRef = useRef(false);

  function handleThemeChange(key) {
    setThemeKey(key);
    localStorage.setItem("uttt-theme", key);
  }

  // Session timer: countdown display + fires after sessionMinutes to end game + session
  const sessionTimerCbRef = useRef(null);
  const sessionStartRef = useRef(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
  useEffect(() => {
    sessionTimerCbRef.current = () => {
      const w = sessionScores.X > sessionScores.O ? "X"
        : sessionScores.O > sessionScores.X ? "O"
        : sessionTotalPts.X > sessionTotalPts.O ? "X"
        : sessionTotalPts.O > sessionTotalPts.X ? "O"
        : "draw";
      setSessionWinner(prev => prev || w);
      setGame(g => g.gameOver ? g : { ...g, gameOver: true });
    };
  });
  useEffect(() => {
    if (!rules.sessionMinutes || !sessionTimerActive) { setSessionTimeLeft(null); return; }
    const totalSecs = rules.sessionMinutes * 60;
    sessionStartRef.current = Date.now();
    setSessionTimeLeft(totalSecs);
    const displayId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const remaining = Math.max(0, totalSecs - elapsed);
      setSessionTimeLeft(remaining);
      if (remaining === 0) clearInterval(displayId);
    }, 500);
    const endId = setTimeout(() => sessionTimerCbRef.current(), totalSecs * 1000);
    return () => { clearInterval(displayId); clearTimeout(endId); };
  }, [rules.sessionMinutes, sessionVersion, sessionTimerActive]);

  // Turn timer: starts after the first move (lastMove non-null), resets each turn
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
    if (!sessionTimerActive) setSessionTimerActive(true);

    let newSessionScores = sessionScores;
    let newSessionTotalPts = sessionTotalPts;
    if (result.gameEnded) {
      const s = calcScores(result.newGame.cells, rules, result.newGame.megaOwners);
      const w = s.xTotal > s.oTotal ? "X" : s.oTotal > s.xTotal ? "O" : "draw";
      newSessionScores = { ...sessionScores, [w]: sessionScores[w] + 1 };
      newSessionTotalPts = { X: sessionTotalPts.X + s.xTotal, O: sessionTotalPts.O + s.oTotal };
      setSessionScores(newSessionScores);
      setSessionTotalPts(newSessionTotalPts);
      if (rules.sessionPoints) {
        if (newSessionTotalPts.X >= rules.sessionPoints && newSessionTotalPts.O >= rules.sessionPoints) {
          setSessionWinner(newSessionTotalPts.X >= newSessionTotalPts.O ? "X" : "O");
        } else if (newSessionTotalPts.X >= rules.sessionPoints) {
          setSessionWinner("X");
        } else if (newSessionTotalPts.O >= rules.sessionPoints) {
          setSessionWinner("O");
        }
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
    setSessionTotalPts({ X: 0, O: 0 });
    setSessionWinner(null);
    setSessionTimerActive(false);
    setLastMove(null);
    setAnimKey(k => k + 1);
    setSessionVersion(v => v + 1);
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
      sessionTimeLeft={sessionTimeLeft}
      onBack={onBack}
    />
  );
}
