import { useState, useEffect, useRef } from "react";
import { THEMES, THEME_ORDER } from "./themes";
import { miniOwner, countLines, completedLines, calcScores, MEGA_BONUS } from "./gameLogic";
import { RULE_DEFS, DEFAULT_RULES, UNLOCK_ALL } from "./rules";

// SVG strike-through coords for each of the 8 lines (as % of viewBox 0 0 100 100)
const LINE_COORDS = [
  { x1:5,  y1:16.5, x2:95, y2:16.5 },
  { x1:5,  y1:50,   x2:95, y2:50   },
  { x1:5,  y1:83.5, x2:95, y2:83.5 },
  { x1:16.5, y1:5,  x2:16.5, y2:95 },
  { x1:50,   y1:5,  x2:50,   y2:95 },
  { x1:83.5, y1:5,  x2:83.5, y2:95 },
  { x1:5,  y1:5,   x2:95, y2:95   },
  { x1:95, y1:5,   x2:5,  y2:95   },
];

function buildStyles(t) {
  return {
    root: {
      minHeight: "100vh", background: t.bg, backgroundImage: t.bgGradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: t.fontBody, position: "relative", overflow: "hidden",
      transition: "background 0.4s",
    },
    noise: {
      position: "fixed", inset: 0, opacity: t.noiseOpacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
      pointerEvents: "none", zIndex: 0,
    },
    container: {
      position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", gap: "13px", padding: "16px", width: "100%", maxWidth: "500px",
    },
    title: {
      fontFamily: t.fontTitle, color: t.chalk, fontSize: "clamp(1.3rem, 5vw, 1.9rem)",
      textAlign: "center", lineHeight: 1.2, letterSpacing: "0.05em",
      textShadow: "2px 2px 10px rgba(0,0,0,0.5)", margin: 0, opacity: 0.88,
    },
    statusArea: {
      textAlign: "center", display: "flex", flexDirection: "column",
      alignItems: "center", gap: "5px", minHeight: "58px", justifyContent: "center",
    },
    status: {
      fontFamily: t.fontTitle, fontSize: "clamp(1.1rem, 4vw, 1.55rem)",
      letterSpacing: "0.04em", textShadow: "1px 1px 6px rgba(0,0,0,0.4)",
    },
    hint: { color: t.chalkDim, fontSize: "clamp(0.68rem, 1.8vw, 0.82rem)", fontStyle: "italic" },
    finalBreakdown: {
      display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap",
      justifyContent: "center", fontSize: "clamp(0.68rem, 2vw, 0.85rem)",
      color: t.chalk, opacity: 0.88,
    },
    liveCount: {
      display: "flex", gap: "8px", alignItems: "center", color: t.chalk, opacity: 0.62,
      fontSize: "clamp(0.7rem, 2vw, 0.86rem)", flexWrap: "wrap", justifyContent: "center",
    },
    megaBoard: {
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)",
      position: "relative", width: "min(92vw, 456px)", height: "min(92vw, 456px)",
      border: `3px solid ${t.chalk}`, borderRadius: "4px", boxShadow: "0 0 50px rgba(0,0,0,0.45)",
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
    lineSvg: { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 7, pointerEvents: "none" },
    miniBadge: {
      position: "absolute", top: 2, right: 3, display: "flex", gap: "1px", alignItems: "center",
      zIndex: 10, pointerEvents: "none", fontFamily: t.fontTitle,
    },
    cell: {
      position: "relative", zIndex: 9, display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.12s", borderRadius: "2px", userSelect: "none",
    },
    bottom: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" },
    scores: {
      display: "flex", gap: "28px", alignItems: "center", color: t.chalk, opacity: 0.75,
      fontSize: "clamp(0.82rem, 2.5vw, 1rem)", letterSpacing: "0.05em",
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

function MiniBoard({ mb, board, isActiveMb, inMegaLine, megaWinnerLive,
  lineScores, doneLines, lastMove, isOver, onMove, t, s }) {
  return (
    <div style={{
      ...s.miniBoard,
      gridRow: Math.floor(mb / 3) + 1,
      gridColumn: (mb % 3) + 1,
      background: inMegaLine
        ? (megaWinnerLive === "X" ? t.xSubtle : t.oSubtle)
        : isFull(board) ? t.fullBg
        : isActiveMb ? t.activeBg
        : "transparent",
      boxShadow: isActiveMb
        ? `inset 0 0 0 2px ${t.activeShadow}, 0 0 14px ${t.activeShadow}`
        : inMegaLine
        ? `inset 0 0 0 1.5px ${megaWinnerLive === "X" ? t.xMegaShadow : t.oMegaShadow}`
        : "none",
      opacity: isFull(board) && !isActiveMb ? 0.72 : 1,
    }}>
      <div style={{ ...s.innerLine, ...s.iV1 }} />
      <div style={{ ...s.innerLine, ...s.iV2 }} />
      <div style={{ ...s.innerLine, ...s.iH1 }} />
      <div style={{ ...s.innerLine, ...s.iH2 }} />

      <svg style={s.lineSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
        {doneLines.map((player, li) => {
          if (!player) return null;
          const { x1, y1, x2, y2 } = LINE_COORDS[li];
          return (
            <line key={li} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={player === "X" ? t.xLine : t.oLine}
              strokeWidth="2.5" strokeLinecap="round" />
          );
        })}
      </svg>

      {(lineScores.x > 0 || lineScores.o > 0) && (
        <div style={s.miniBadge}>
          {lineScores.x > 0 && <span style={{ color: t.xBadge, fontSize: "0.6em" }}>{lineScores.x}</span>}
          {lineScores.x > 0 && lineScores.o > 0 && <span style={{ color: t.chalkDim, fontSize: "0.55em" }}>·</span>}
          {lineScores.o > 0 && <span style={{ color: t.oBadge, fontSize: "0.6em" }}>{lineScores.o}</span>}
        </div>
      )}

      {Array(9).fill(null).map((_, c) => {
        const val = board[c];
        const canClick = !isOver && !val && isActiveMb;
        const isLast = lastMove && lastMove.mb === mb && lastMove.c === c;
        return (
          <div key={c} onClick={() => canClick && onMove(mb, c)} style={{
            ...s.cell,
            gridRow: Math.floor(c / 3) + 1, gridColumn: (c % 3) + 1,
            color: val === "X" ? t.xColor : val === "O" ? t.oColor : "transparent",
            cursor: canClick ? "pointer" : "default",
            background: isLast ? t.lastMoveBg : "transparent",
          }}>
            {val && (
              <span style={{
                display: "block",
                animation: "popIn 0.22s cubic-bezier(0.17,0.89,0.32,1.28) both",
                textShadow: val === "X" ? `0 0 8px ${t.xGlow}` : `0 0 8px ${t.oGlow}`,
                fontSize: "clamp(0.68rem, 2.1vw, 1.15rem)",
                fontFamily: t.fontTitle,
              }}>{val}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isFull(board) {
  return board.every(c => c !== null);
}

function NameInput({ player, names, onNameChange, canEdit, color, fontFamily }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(names[player]);

  function save() {
    const trimmed = draft.trim();
    onNameChange(player, trimmed || player);
    setEditing(false);
  }

  if (editing) {
    return (
      <input value={draft} autoFocus
        onChange={e => setDraft(e.target.value.slice(0, 12))}
        onBlur={save}
        onKeyDown={e => e.key === "Enter" && save()}
        style={{
          fontFamily, color, background: "transparent", border: "none",
          borderBottom: `1px solid ${color}`, fontSize: "inherit",
          width: "80px", outline: "none", textAlign: "center", padding: 0,
        }}
      />
    );
  }

  return (
    <span onClick={() => canEdit && setEditing(true)} style={{
      color, fontFamily,
      cursor: canEdit ? "pointer" : "default",
      borderBottom: canEdit ? `1px dashed ${color}55` : "none",
    }}>
      {names[player]}
    </span>
  );
}

function NumberRuleInput({ value, onChange, canEdit, t }) {
  const [draft, setDraft] = useState(value != null ? String(value) : "");

  useEffect(() => {
    setDraft(value != null ? String(value) : "");
  }, [value]);

  function commit(raw) {
    const n = parseInt(raw, 10);
    if (!raw.trim() || isNaN(n) || n <= 0) {
      onChange(null);
    } else {
      onChange(n);
      setDraft(String(n));
    }
  }

  const btnBase = {
    fontFamily: "inherit", fontSize: "0.64rem", letterSpacing: "0.03em",
    padding: "2px 7px", borderRadius: "10px", transition: "all 0.15s",
    cursor: canEdit ? "pointer" : "default",
  };

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      <button
        onClick={() => canEdit && onChange(null)}
        style={{
          ...btnBase,
          color: value == null ? t.chalk : t.chalkDim,
          background: value == null ? "rgba(255,255,255,0.1)" : "transparent",
          border: `1px solid ${value == null ? t.chalk : t.chalkDim}`,
          opacity: value == null ? 1 : 0.55,
        }}
      >Off</button>
      <input
        type="number" min="1"
        value={draft}
        disabled={!canEdit}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={e => e.key === "Enter" && commit(draft)}
        placeholder="pts"
        style={{
          width: "46px", fontFamily: "inherit", fontSize: "0.64rem",
          color: value != null ? t.chalk : t.chalkDim,
          background: value != null ? "rgba(255,255,255,0.1)" : "transparent",
          border: `1px solid ${value != null ? t.chalk : t.chalkDim}`,
          padding: "2px 5px", borderRadius: "10px", textAlign: "center",
          outline: "none", opacity: value != null ? 1 : 0.55,
          MozAppearance: "textfield",
        }}
      />
    </div>
  );
}

function RuleRow({ def, value, onChange, canEdit, locked, t }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 8, opacity: locked ? 0.32 : 1,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ color: t.chalk, fontSize: "0.7rem", letterSpacing: "0.03em" }}>
          {def.label}
          {locked && <span style={{ color: t.chalkDim, fontSize: "0.65em", marginLeft: 4 }}>(coming soon)</span>}
        </span>
        {def.description && (
          <span style={{ color: t.chalkDim, fontSize: "0.6rem", lineHeight: 1.4, opacity: 0.75 }}>
            {def.description}
          </span>
        )}
      </div>
      {def.type === "number" ? (
        <NumberRuleInput value={value} onChange={!locked && canEdit ? onChange : () => {}} canEdit={!locked && canEdit} t={t} />
      ) : (
        <div style={{ display: "flex", gap: 3 }}>
          {def.options.map(opt => {
            const active = value === opt.value;
            return (
              <button key={String(opt.value)} onClick={() => !locked && canEdit && onChange(opt.value)} style={{
                fontFamily: "inherit", fontSize: "0.64rem", letterSpacing: "0.03em",
                color: active ? t.chalk : t.chalkDim,
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                border: `1px solid ${active ? t.chalk : t.chalkDim}`,
                padding: "2px 7px", borderRadius: "10px",
                cursor: !locked && canEdit ? "pointer" : "default",
                opacity: active ? 1 : 0.55, transition: "all 0.15s",
              }}>{opt.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RulesPanel({ rules, onRulesChange, canEdit, gameInProgress, t, s }) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const prevLocked = useRef(gameInProgress);
  const free = RULE_DEFS.filter(d => !d.locked || UNLOCK_ALL);
  const locked = RULE_DEFS.filter(d => d.locked && !UNLOCK_ALL);

  useEffect(() => {
    if (prevLocked.current && !gameInProgress) {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 1400);
      return () => clearTimeout(id);
    }
    prevLocked.current = gameInProgress;
  }, [gameInProgress]);

  const effectiveCanEdit = canEdit && !gameInProgress;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      borderRadius: 6, animation: flash ? "rulesUnlock 1.4s ease-out" : "none",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        ...s.btn, fontSize: "0.72rem", padding: "4px 16px", opacity: 0.45,
      }}>
        Rules{gameInProgress ? <span style={{ color: t.chalkDim, fontSize: "0.85em", marginLeft: 5, opacity: 0.7 }}>(locked)</span> : null} {open ? "▲" : "▼"}
      </button>

      {open && (
        <div style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 6,
          padding: "10px 14px", display: "flex", flexDirection: "column", gap: 9,
        }}>
          {gameInProgress && (
            <div style={{ color: t.chalkDim, fontSize: "0.62rem", textAlign: "center", opacity: 0.7, paddingBottom: 4, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
              Rules are locked while a game is in progress.
            </div>
          )}
          {free.map(def => (
            <RuleRow key={def.key} def={def} value={rules[def.key]}
              onChange={v => onRulesChange({ ...rules, [def.key]: v })}
              canEdit={effectiveCanEdit} locked={false} t={t} />
          ))}
          <div style={{ borderTop: `1px solid ${t.chalkDim}`, opacity: 0.25, margin: "2px 0" }} />
          {locked.map(def => (
            <RuleRow key={def.key} def={def} value={rules[def.key]}
              onChange={() => {}} canEdit={false} locked={true} t={t} />
          ))}
          {!canEdit && !gameInProgress && (
            <div style={{ color: t.chalkDim, fontSize: "0.62rem", textAlign: "center", marginTop: 2, opacity: 0.6 }}>
              Only the host (X) can change rules
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewGameModal({ rules, onRulesChange, canEdit, onStart, onCancel, t, s }) {
  const free = RULE_DEFS.filter(d => !d.locked || UNLOCK_ALL);
  const locked = RULE_DEFS.filter(d => d.locked && !UNLOCK_ALL);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "rgba(30,30,20,0.96)",
        border: `1px solid rgba(255,255,255,0.18)`,
        borderRadius: 10, padding: "24px 24px 20px",
        width: "100%", maxWidth: "440px",
        display: "flex", flexDirection: "column", gap: 18,
        boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
      }}>
        <div style={{ fontFamily: t.fontTitle, color: t.chalk, fontSize: "1.25rem",
          textAlign: "center", letterSpacing: "0.06em", opacity: 0.9 }}>
          Set Up New Game
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {free.map(def => (
            <RuleRow key={def.key} def={def} value={rules[def.key]}
              onChange={v => onRulesChange({ ...rules, [def.key]: v })}
              canEdit={canEdit} locked={false} t={t} />
          ))}
          {locked.length > 0 && (
            <>
              <div style={{ borderTop: `1px solid ${t.chalkDim}`, opacity: 0.2, margin: "2px 0" }} />
              {locked.map(def => (
                <RuleRow key={def.key} def={def} value={rules[def.key]}
                  onChange={() => {}} canEdit={false} locked={true} t={t} />
              ))}
            </>
          )}
          {!canEdit && (
            <div style={{ color: t.chalkDim, fontSize: "0.62rem", textAlign: "center", opacity: 0.6 }}>
              Only the host (X) can change rules
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {onCancel && (
            <button onClick={onCancel} style={{ ...s.btn, opacity: 0.45 }}>Cancel</button>
          )}
          <button onClick={onStart} style={{
            ...s.btn, opacity: 1,
            background: "rgba(255,255,255,0.1)",
          }}>Start Game</button>
        </div>
      </div>
    </div>
  );
}

export default function GameUI({
  game, sessionScores, lastMove, animKey,
  onMove, onNewGame, onResetAll,
  themeKey, onThemeChange,
  myRole = null, isWaiting = false, shareUrl = null, onCopyLink, onBack,
  rules = DEFAULT_RULES, onRulesChange = () => {}, canEditRules = true,
  names = { X: "X", O: "O" }, onNameChange = () => {}, canEditNames = { X: true, O: true },
  timeLeft = null, sessionWinner = null, gameInProgress = false, sessionTimeLeft = null,
}) {
  const t = THEMES[themeKey];
  const s = buildStyles(t);
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const { cells, currentPlayer, activeBoard, gameOver, megaOwners } = game;
  const isOver = gameOver;
  const scores = calcScores(cells, rules, megaOwners);
  const megaLine = scores.megaLine;
  const megaWinnerLive = scores.megaWinner;

  const gameWinner = isOver
    ? scores.xTotal > scores.oTotal ? "X" : scores.oTotal > scores.xTotal ? "O" : "draw"
    : null;

  let statusText, statusColor;
  if (sessionWinner) {
    if (sessionWinner === "draw") {
      statusText = "Session ends in a draw!";
      statusColor = t.chalkDim;
    } else {
      statusText = `${names[sessionWinner]} wins the session!`;
      statusColor = sessionWinner === "X" ? t.xColor : t.oColor;
    }
  } else if (isWaiting) {
    statusText = "Waiting for opponent…";
    statusColor = t.chalkDim;
  } else if (isOver) {
    statusText = gameWinner === "draw" ? "Draw!" : `${names[gameWinner]} Wins!`;
    statusColor = gameWinner === "X" ? t.xColor : gameWinner === "O" ? t.oColor : t.chalkDim;
  } else if (myRole && currentPlayer !== myRole) {
    statusText = `${names[currentPlayer]}'s Turn`;
    statusColor = currentPlayer === "X" ? t.xColor : t.oColor;
  } else {
    statusText = myRole ? "Your Turn" : `${names[currentPlayer]}'s Turn`;
    statusColor = currentPlayer === "X" ? t.xColor : t.oColor;
  }

  const hintText = !isOver && !isWaiting && (
    activeBoard === null ? "Free choice — play any open board" : `Play in board ${activeBoard + 1}`
  );

  return (
    <div style={s.root}>
      <div style={s.noise} />
      <div style={s.container} key={animKey}>

        <h1 style={s.title}>Ultimate<br />Tic-Tac-Toe</h1>

        {myRole && (
          <div style={{ color: t.chalkDim, fontSize: "0.75rem", letterSpacing: "0.06em", marginTop: -6 }}>
            You are&nbsp;
            <span style={{ color: myRole === "X" ? t.xColor : t.oColor, fontFamily: t.fontTitle }}>
              {names[myRole]}
            </span>
          </div>
        )}

        <div style={s.statusArea}>
          <div style={{ ...s.status, color: statusColor }}>{statusText}</div>
          {sessionTimeLeft !== null && !sessionWinner && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{
                fontFamily: t.fontTitle,
                fontSize: "clamp(1.3rem, 4.5vw, 1.75rem)",
                letterSpacing: "0.06em",
                color: sessionTimeLeft <= 10 ? "#ff5555" : sessionTimeLeft <= 30 ? "#ffaa44" : t.chalk,
                transition: "color 0.6s",
              }}>
                {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}
              </span>
              <div style={{ width: "min(80vw, 340px)", height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${(sessionTimeLeft / (rules.sessionMinutes * 60)) * 100}%`,
                  background: sessionTimeLeft <= 10 ? "#ff5555" : sessionTimeLeft <= 30 ? "#ffaa44" : t.chalk,
                  transition: "width 0.5s linear, background 0.6s",
                }} />
              </div>
              <span style={{ color: t.chalkDim, fontSize: "0.6rem", letterSpacing: "0.05em", opacity: 0.6 }}>session</span>
            </div>
          )}
          {hintText && <div style={s.hint}>{hintText}</div>}
          {timeLeft !== null && !isOver && !isWaiting && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 2 }}>
              <span style={{
                fontFamily: t.fontTitle,
                fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)",
                color: timeLeft <= 5 ? "#ff5555" : timeLeft <= 10 ? "#ffaa44" : t.chalk,
                transition: "color 0.4s",
                letterSpacing: "0.05em",
              }}>{timeLeft}s</span>
              <div style={{ width: "min(80vw, 340px)", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${(timeLeft / rules.timeLimit) * 100}%`,
                  background: timeLeft <= 5 ? "#ff5555" : timeLeft <= 10 ? "#ffaa44" : t.chalk,
                  transition: "width 1s linear, background 0.4s",
                }} />
              </div>
            </div>
          )}
          {isOver && (
            <div style={s.finalBreakdown}>
              <span style={{ color: t.xColor }}>
                {names.X}: {scores.x} line{scores.x !== 1 ? "s" : ""}
                {scores.xBonus > 0 ? ` +${scores.xBonus} mega` : ""} = <b>{scores.xTotal}pts</b>
              </span>
              <span style={{ color: t.chalkDim }}>vs</span>
              <span style={{ color: t.oColor }}>
                {names.O}: {scores.o} line{scores.o !== 1 ? "s" : ""}
                {scores.oBonus > 0 ? ` +${scores.oBonus} mega` : ""} = <b>{scores.oTotal}pts</b>
              </span>
            </div>
          )}
        </div>

        <div style={s.liveCount}>
          <span style={{ color: t.xColor }}>{names.X}: {scores.x}pts</span>
          <span style={{ color: t.chalkDim, fontSize: "0.82em" }}>lines scored</span>
          <span style={{ color: t.oColor }}>{names.O}: {scores.o}pts</span>
          {megaWinnerLive && (
            <span style={{ color: megaWinnerLive === "X" ? t.xColor : t.oColor, fontSize: "0.78em", opacity: 0.8, marginLeft: 6 }}>
              · {names[megaWinnerLive]} has mega (+{MEGA_BONUS})
            </span>
          )}
        </div>

        <div style={s.megaBoard}>
          <div style={{ ...s.outerLine, ...s.oV1 }} />
          <div style={{ ...s.outerLine, ...s.oV2 }} />
          <div style={{ ...s.outerLine, ...s.oH1 }} />
          <div style={{ ...s.outerLine, ...s.oH2 }} />

          {Array(9).fill(null).map((_, mb) => {
            const board = cells[mb];
            const full = isFull(board);
            const isActiveMb = !isOver && !isWaiting && (activeBoard === null || activeBoard === mb) && !full;
            const inMegaLine = megaLine && megaLine.includes(mb);
            return (
              <MiniBoard key={mb} mb={mb} board={board} isActiveMb={isActiveMb}
                inMegaLine={inMegaLine} megaWinnerLive={megaWinnerLive}
                lineScores={countLines(board)} doneLines={completedLines(board)}
                lastMove={lastMove} isOver={isOver} onMove={onMove} t={t} s={s} />
            );
          })}
        </div>

        {/* Share link (online only, while waiting) */}
        {shareUrl && isWaiting && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: t.chalkDim, fontSize: "0.72rem" }}>Share this link with your opponent:</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <code style={{
                color: t.chalk, background: "rgba(255,255,255,0.06)", border: `1px solid ${t.chalkDim}`,
                borderRadius: 4, padding: "3px 8px", fontSize: "0.72rem", letterSpacing: "0.04em",
              }}>{shareUrl}</code>
              <button onClick={onCopyLink} style={{ ...s.btn, padding: "3px 10px", fontSize: "0.72rem", opacity: 0.65 }}>
                Copy
              </button>
            </div>
          </div>
        )}

        <div style={s.bottom}>
          <div style={s.scores}>
            <div style={s.scoreItem}>
              <NameInput player="X" names={names} onNameChange={onNameChange}
                canEdit={canEditNames.X} color={t.xColor} fontFamily={t.fontTitle} />
              <span style={s.scoreNum}>{sessionScores.X}</span>
            </div>
            <div style={{ ...s.scoreItem, opacity: 0.4, fontSize: "0.82em" }}>
              <span style={{ color: t.chalk }}>draws</span>
              <span style={s.scoreNum}>{sessionScores.draw}</span>
            </div>
            <div style={s.scoreItem}>
              <NameInput player="O" names={names} onNameChange={onNameChange}
                canEdit={canEditNames.O} color={t.oColor} fontFamily={t.fontTitle} />
              <span style={s.scoreNum}>{sessionScores.O}</span>
            </div>
          </div>

          {/* Skin switcher */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {THEME_ORDER.map(key => {
              const th = THEMES[key];
              const isActive = key === themeKey;
              return (
                <button key={key} onClick={() => onThemeChange(key)} style={{
                  fontFamily: t.fontBody, fontSize: "0.7rem", letterSpacing: "0.06em",
                  color: isActive ? th.labelColor : t.chalkDim,
                  background: isActive ? th.swatch : "transparent",
                  border: `1.5px solid ${isActive ? th.swatch : t.chalkDim}`,
                  padding: "3px 10px", cursor: "pointer", borderRadius: "20px",
                  transition: "all 0.2s", opacity: isActive ? 1 : 0.6,
                }}>{th.name}</button>
              );
            })}
          </div>

          <div style={s.buttons}>
            {!sessionWinner && (
              <button onClick={() => setShowNewGameModal(true)} style={s.btn}>New Game</button>
            )}
            <button onClick={onResetAll} style={{ ...s.btn, opacity: sessionWinner ? 0.85 : 0.3, borderColor: sessionWinner ? t.chalk : t.chalkDim }}>
              {sessionWinner ? "New Session" : "Reset All"}
            </button>
            {onBack && (
              <button onClick={onBack} style={{ ...s.btn, opacity: 0.3, borderColor: t.chalkDim }}>Menu</button>
            )}
          </div>
        </div>
      </div>

      {showNewGameModal && (
        <NewGameModal
          rules={rules}
          onRulesChange={onRulesChange}
          canEdit={canEditRules}
          onStart={() => { onNewGame(); setShowNewGameModal(false); }}
          onCancel={lastMove || isOver ? () => setShowNewGameModal(false) : null}
          t={t} s={s}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes popIn {
          from { transform: scale(0.25) rotate(-12deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes rulesUnlock {
          0%   { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.25); }
          100% { box-shadow: none; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}
