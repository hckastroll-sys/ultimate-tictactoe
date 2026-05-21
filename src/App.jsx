import { useState } from "react";
import { THEMES, THEME_ORDER } from "./themes";

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const MEGA_BONUS = 3;

function isFull(board) {
  return board.every(c => c !== null);
}

function miniOwner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function countLines(board) {
  let x = 0, o = 0;
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      board[a] === "X" ? x++ : o++;
    }
  }
  return { x, o };
}

function completedLines(board) {
  return LINES.map(([a, b, c]) => {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    return null;
  });
}

function getMegaWinLine(cells) {
  const owners = cells.map(b => miniOwner(b));
  for (const [a, b, c] of LINES) {
    if (owners[a] && owners[a] === owners[b] && owners[a] === owners[c]) return [a, b, c];
  }
  return null;
}

function calcScores(cells) {
  let x = 0, o = 0;
  for (const board of cells) {
    const c = countLines(board);
    x += c.x;
    o += c.o;
  }
  const megaLine = getMegaWinLine(cells);
  const megaWinner = megaLine ? miniOwner(cells[megaLine[0]]) : null;
  const xTotal = x + (megaWinner === "X" ? MEGA_BONUS : 0);
  const oTotal = o + (megaWinner === "O" ? MEGA_BONUS : 0);
  return { x, o, xTotal, oTotal, megaWinner, megaLine };
}

const emptyGame = () => ({
  cells: Array(9).fill(null).map(() => Array(9).fill(null)),
  currentPlayer: "X",
  activeBoard: null,
  gameOver: false,
});

function buildStyles(t) {
  return {
    root: {
      minHeight: "100vh",
      background: t.bg,
      backgroundImage: t.bgGradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: t.fontBody,
      position: "relative", overflow: "hidden",
      transition: "background 0.4s",
    },
    noise: {
      position: "fixed", inset: 0, opacity: t.noiseOpacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
      pointerEvents: "none", zIndex: 0,
    },
    container: {
      position: "relative", zIndex: 1,
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "13px", padding: "16px", width: "100%", maxWidth: "500px",
    },
    title: {
      fontFamily: t.fontTitle,
      color: t.chalk, fontSize: "clamp(1.3rem, 5vw, 1.9rem)",
      textAlign: "center", lineHeight: 1.2, letterSpacing: "0.05em",
      textShadow: "2px 2px 10px rgba(0,0,0,0.5)", margin: 0, opacity: 0.88,
    },
    statusArea: {
      textAlign: "center", display: "flex", flexDirection: "column",
      alignItems: "center", gap: "5px", minHeight: "58px", justifyContent: "center",
    },
    status: {
      fontFamily: t.fontTitle,
      fontSize: "clamp(1.1rem, 4vw, 1.55rem)",
      letterSpacing: "0.04em", textShadow: "1px 1px 6px rgba(0,0,0,0.4)",
    },
    hint: { color: t.chalkDim, fontSize: "clamp(0.68rem, 1.8vw, 0.82rem)", fontStyle: "italic" },
    finalBreakdown: {
      display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap",
      justifyContent: "center", fontSize: "clamp(0.68rem, 2vw, 0.85rem)",
      color: t.chalk, opacity: 0.88,
    },
    liveCount: {
      display: "flex", gap: "8px", alignItems: "center",
      color: t.chalk, opacity: 0.62, fontSize: "clamp(0.7rem, 2vw, 0.86rem)",
      flexWrap: "wrap", justifyContent: "center",
    },
    megaBoard: {
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)",
      position: "relative", width: "min(92vw, 456px)", height: "min(92vw, 456px)",
      border: `3px solid ${t.chalk}`, borderRadius: "4px",
      boxShadow: "0 0 50px rgba(0,0,0,0.45)",
    },
    outerLine: { position: "absolute", background: t.chalk, zIndex: 5, pointerEvents: "none", borderRadius: "2px" },
    oV1: { width: "3px", height: "100%", left: "calc(33.33% - 1.5px)", top: 0 },
    oV2: { width: "3px", height: "100%", left: "calc(66.66% - 1.5px)", top: 0 },
    oH1: { height: "3px", width: "100%", top: "calc(33.33% - 1.5px)", left: 0 },
    oH2: { height: "3px", width: "100%", top: "calc(66.66% - 1.5px)", left: 0 },
    miniBoard: {
      position: "relative", display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)",
      padding: "5%", transition: "background 0.3s, box-shadow 0.3s, opacity 0.3s",
    },
    innerLine: { position: "absolute", background: t.chalkDim, zIndex: 1, pointerEvents: "none", borderRadius: "1px" },
    iV1: { width: "1.5px", height: "85%", left: "calc(33.33% - 0.75px)", top: "7.5%" },
    iV2: { width: "1.5px", height: "85%", left: "calc(66.66% - 0.75px)", top: "7.5%" },
    iH1: { height: "1.5px", width: "85%", top: "calc(33.33% - 0.75px)", left: "7.5%" },
    iH2: { height: "1.5px", width: "85%", top: "calc(66.66% - 0.75px)", left: "7.5%" },
    lineSvg: {
      position: "absolute", inset: 0, width: "100%", height: "100%",
      zIndex: 7, pointerEvents: "none",
    },
    miniBadge: {
      position: "absolute", top: 2, right: 3,
      display: "flex", gap: "1px", alignItems: "center",
      zIndex: 10, pointerEvents: "none",
      fontFamily: t.fontTitle,
    },
    cell: {
      position: "relative", zIndex: 9, display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.12s", borderRadius: "2px", userSelect: "none",
    },
    bottom: {
      display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%",
    },
    scores: {
      display: "flex", gap: "28px", alignItems: "center",
      color: t.chalk, opacity: 0.75, fontSize: "clamp(0.82rem, 2.5vw, 1rem)", letterSpacing: "0.05em",
    },
    scoreItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", textAlign: "center" },
    scoreNum: { fontFamily: t.fontTitle, fontSize: "1.4em", color: t.chalk },
    buttons: { display: "flex", gap: "10px" },
    btn: {
      fontFamily: t.fontBody, fontSize: "0.88rem", letterSpacing: "0.08em",
      color: t.chalk, background: "transparent", border: `1.5px solid ${t.chalk}`,
      padding: "7px 22px", cursor: "pointer", borderRadius: "3px", opacity: 0.75,
    },
  };
}

export default function App() {
  const [game, setGame] = useState(emptyGame());
  const [sessionScores, setSessionScores] = useState({ X: 0, O: 0, draw: 0 });
  const [lastMove, setLastMove] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [themeKey, setThemeKey] = useState("chalkboard");

  const t = THEMES[themeKey];
  const s = buildStyles(t);

  const { cells, currentPlayer, activeBoard, gameOver } = game;
  const isOver = gameOver;

  const scores = calcScores(cells);
  const gameWinner = isOver
    ? scores.xTotal > scores.oTotal ? "X"
    : scores.oTotal > scores.xTotal ? "O"
    : "draw"
    : null;

  const megaLine = getMegaWinLine(cells);
  const megaWinnerLive = megaLine ? miniOwner(cells[megaLine[0]]) : null;

  function makeMove(mb, c) {
    if (isOver) return;
    if (cells[mb][c]) return;
    if (activeBoard !== null && activeBoard !== mb) return;

    const newCells = cells.map((b, i) =>
      i === mb ? b.map((v, j) => j === c ? currentPlayer : v) : b
    );

    const nextPlayer = currentPlayer === "X" ? "O" : "X";

    const target = c;
    const targetFull = isFull(newCells[target]);

    if (targetFull) {
      const sc = calcScores(newCells);
      const w = sc.xTotal > sc.oTotal ? "X" : sc.oTotal > sc.xTotal ? "O" : "draw";
      setSessionScores(prev => ({ ...prev, [w]: prev[w] + 1 }));
      setLastMove({ mb, c });
      setGame({ cells: newCells, currentPlayer: nextPlayer, activeBoard: null, gameOver: true });
      return;
    }

    setLastMove({ mb, c });
    setGame({
      cells: newCells,
      currentPlayer: nextPlayer,
      activeBoard: target,
      gameOver: false,
    });
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

  let statusText, statusColor;
  if (isOver) {
    statusText = gameWinner === "draw" ? "Draw!" : `${gameWinner} Wins!`;
    statusColor = gameWinner === "X" ? t.xColor : gameWinner === "O" ? t.oColor : t.chalkDim;
  } else {
    statusText = `${currentPlayer}'s Turn`;
    statusColor = currentPlayer === "X" ? t.xColor : t.oColor;
  }

  const hintText = !isOver && (
    activeBoard === null
      ? "Free choice — play any open board"
      : `Play in board ${activeBoard + 1}`
  );

  return (
    <div style={s.root}>
      <div style={s.noise} />
      <div style={s.container} key={animKey}>

        <h1 style={s.title}>Ultimate<br />Tic-Tac-Toe</h1>

        {/* Status */}
        <div style={s.statusArea}>
          <div style={{ ...s.status, color: statusColor }}>{statusText}</div>
          {hintText && <div style={s.hint}>{hintText}</div>}
          {isOver && (
            <div style={s.finalBreakdown}>
              <span style={{ color: t.xColor }}>
                X: {scores.x} line{scores.x !== 1 ? "s" : ""}
                {scores.megaWinner === "X" ? ` +${MEGA_BONUS} mega` : ""} = <b>{scores.xTotal}pts</b>
              </span>
              <span style={{ color: t.chalkDim }}>vs</span>
              <span style={{ color: t.oColor }}>
                O: {scores.o} line{scores.o !== 1 ? "s" : ""}
                {scores.megaWinner === "O" ? ` +${MEGA_BONUS} mega` : ""} = <b>{scores.oTotal}pts</b>
              </span>
            </div>
          )}
        </div>

        {/* Live score */}
        <div style={s.liveCount}>
          <span style={{ color: t.xColor }}>X: {scores.x}pts</span>
          <span style={{ color: t.chalkDim, fontSize: "0.82em" }}>lines scored</span>
          <span style={{ color: t.oColor }}>O: {scores.o}pts</span>
          {megaWinnerLive && (
            <span style={{
              color: megaWinnerLive === "X" ? t.xColor : t.oColor,
              fontSize: "0.78em", opacity: 0.8, marginLeft: 6,
            }}>
              · {megaWinnerLive} has mega (+{MEGA_BONUS})
            </span>
          )}
        </div>

        {/* Board */}
        <div style={s.megaBoard}>
          <div style={{ ...s.outerLine, ...s.oV1 }} />
          <div style={{ ...s.outerLine, ...s.oV2 }} />
          <div style={{ ...s.outerLine, ...s.oH1 }} />
          <div style={{ ...s.outerLine, ...s.oH2 }} />

          {Array(9).fill(null).map((_, mb) => {
            const board = cells[mb];
            const owner = miniOwner(board);
            const full = isFull(board);
            const isActiveMb = !isOver && (activeBoard === null || activeBoard === mb) && !full;
            const inMegaLine = megaLine && megaLine.includes(mb);
            const lineScores = countLines(board);
            const doneLines = completedLines(board);

            return (
              <MiniBoard
                key={mb}
                mb={mb}
                board={board}
                owner={owner}
                full={full}
                isActiveMb={isActiveMb}
                inMegaLine={inMegaLine}
                megaWinnerLive={megaWinnerLive}
                lineScores={lineScores}
                doneLines={doneLines}
                lastMove={lastMove}
                isOver={isOver}
                onMove={makeMove}
                t={t}
                s={s}
              />
            );
          })}
        </div>

        {/* Session scores + skin switcher + buttons */}
        <div style={s.bottom}>
          <div style={s.scores}>
            <div style={s.scoreItem}>
              <span style={{ color: t.xColor, fontFamily: t.fontTitle }}>X</span>
              <span style={s.scoreNum}>{sessionScores.X}</span>
            </div>
            <div style={{ ...s.scoreItem, opacity: 0.4, fontSize: "0.82em" }}>
              <span style={{ color: t.chalk }}>draws</span>
              <span style={s.scoreNum}>{sessionScores.draw}</span>
            </div>
            <div style={s.scoreItem}>
              <span style={{ color: t.oColor, fontFamily: t.fontTitle }}>O</span>
              <span style={s.scoreNum}>{sessionScores.O}</span>
            </div>
          </div>

          {/* Skin switcher */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {THEME_ORDER.map(key => {
              const th = THEMES[key];
              const isActive = key === themeKey;
              return (
                <button
                  key={key}
                  onClick={() => setThemeKey(key)}
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: "0.7rem",
                    letterSpacing: "0.06em",
                    color: isActive ? th.labelColor : t.chalkDim,
                    background: isActive ? th.swatch : "transparent",
                    border: `1.5px solid ${isActive ? th.swatch : t.chalkDim}`,
                    padding: "3px 10px",
                    cursor: "pointer",
                    borderRadius: "20px",
                    transition: "all 0.2s",
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {th.name}
                </button>
              );
            })}
          </div>

          <div style={s.buttons}>
            <button onClick={newGame} style={s.btn}>New Game</button>
            <button onClick={resetAll} style={{ ...s.btn, opacity: 0.3, borderColor: t.chalkDim }}>Reset All</button>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes popIn {
          from { transform: scale(0.25) rotate(-12deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// SVG strike-through coords for each of the 8 lines (as % of viewBox 0 0 100 100)
const LINE_COORDS = [
  { x1:5,  y1:16.5, x2:95, y2:16.5 }, // row 0
  { x1:5,  y1:50,   x2:95, y2:50   }, // row 1
  { x1:5,  y1:83.5, x2:95, y2:83.5 }, // row 2
  { x1:16.5, y1:5,  x2:16.5, y2:95 }, // col 0
  { x1:50,   y1:5,  x2:50,   y2:95 }, // col 1
  { x1:83.5, y1:5,  x2:83.5, y2:95 }, // col 2
  { x1:5,  y1:5,   x2:95, y2:95   }, // diag \
  { x1:95, y1:5,   x2:5,  y2:95   }, // diag /
];

function MiniBoard({ mb, board, owner, full, isActiveMb, inMegaLine, megaWinnerLive,
  lineScores, doneLines, lastMove, isOver, onMove, t, s }) {

  return (
    <div style={{
      ...s.miniBoard,
      gridRow: Math.floor(mb / 3) + 1,
      gridColumn: (mb % 3) + 1,
      background: inMegaLine
        ? (megaWinnerLive === "X" ? t.xSubtle : t.oSubtle)
        : full ? t.fullBg
        : isActiveMb ? t.activeBg
        : "transparent",
      boxShadow: isActiveMb
        ? `inset 0 0 0 2px ${t.activeShadow}, 0 0 14px ${t.activeShadow}`
        : inMegaLine
        ? `inset 0 0 0 1.5px ${megaWinnerLive === "X" ? t.xMegaShadow : t.oMegaShadow}`
        : "none",
      opacity: full && !isActiveMb ? 0.72 : 1,
    }}>
      {/* Inner grid lines */}
      <div style={{ ...s.innerLine, ...s.iV1 }} />
      <div style={{ ...s.innerLine, ...s.iV2 }} />
      <div style={{ ...s.innerLine, ...s.iH1 }} />
      <div style={{ ...s.innerLine, ...s.iH2 }} />

      {/* Strike-through lines for completed rows/cols/diags */}
      <svg style={s.lineSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
        {doneLines.map((player, li) => {
          if (!player) return null;
          const { x1, y1, x2, y2 } = LINE_COORDS[li];
          return (
            <line
              key={li}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={player === "X" ? t.xLine : t.oLine}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Score badge top-right of mini-board */}
      {(lineScores.x > 0 || lineScores.o > 0) && (
        <div style={s.miniBadge}>
          {lineScores.x > 0 && (
            <span style={{ color: t.xBadge, fontSize: "0.6em" }}>{lineScores.x}</span>
          )}
          {lineScores.x > 0 && lineScores.o > 0 && (
            <span style={{ color: t.chalkDim, fontSize: "0.55em" }}>·</span>
          )}
          {lineScores.o > 0 && (
            <span style={{ color: t.oBadge, fontSize: "0.6em" }}>{lineScores.o}</span>
          )}
        </div>
      )}

      {/* Cells */}
      {Array(9).fill(null).map((_, c) => {
        const val = board[c];
        const canClick = !isOver && !val && isActiveMb;
        const isLast = lastMove && lastMove.mb === mb && lastMove.c === c;

        return (
          <div
            key={c}
            onClick={() => canClick && onMove(mb, c)}
            style={{
              ...s.cell,
              gridRow: Math.floor(c / 3) + 1,
              gridColumn: (c % 3) + 1,
              color: val === "X" ? t.xColor : val === "O" ? t.oColor : "transparent",
              cursor: canClick ? "pointer" : "default",
              background: isLast ? t.lastMoveBg : "transparent",
            }}
          >
            {val && (
              <span style={{
                display: "block",
                animation: "popIn 0.22s cubic-bezier(0.17,0.89,0.32,1.28) both",
                textShadow: val === "X"
                  ? `0 0 8px ${t.xGlow}`
                  : `0 0 8px ${t.oGlow}`,
                fontSize: "clamp(0.68rem, 2.1vw, 1.15rem)",
                fontFamily: t.fontTitle,
              }}>
                {val}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
