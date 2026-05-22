export const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

export const MEGA_BONUS = 3;

export function isFull(board) {
  return board.every(c => c !== null);
}

export function miniOwner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function countLines(board) {
  let x = 0, o = 0;
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      board[a] === "X" ? x++ : o++;
    }
  }
  return { x, o };
}

export function completedLines(board) {
  return LINES.map(([a, b, c]) => {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    return null;
  });
}

export function getMegaWinLine(cells) {
  const owners = cells.map(b => miniOwner(b));
  for (const [a, b, c] of LINES) {
    if (owners[a] && owners[a] === owners[b] && owners[a] === owners[c]) return [a, b, c];
  }
  return null;
}

export function calcScores(cells, rules) {
  let x = 0, o = 0;
  for (const board of cells) {
    const c = countLines(board);
    x += c.x;
    o += c.o;
  }

  const owners = cells.map(b => miniOwner(b));
  const xMegaLines = [], oMegaLines = [];
  for (const line of LINES) {
    const [a, b, c] = line;
    if (owners[a] && owners[a] === owners[b] && owners[a] === owners[c]) {
      (owners[a] === "X" ? xMegaLines : oMegaLines).push(line);
    }
  }

  const megaLine = xMegaLines[0] || oMegaLines[0] || null;
  const megaWinner = megaLine ? owners[megaLine[0]] : null;

  let xBonus = 0, oBonus = 0;
  if ((rules?.megaBonus ?? "first") === "all_unique") {
    if (xMegaLines.length > 0) xBonus = MEGA_BONUS;
    if (oMegaLines.length > 0) oBonus = MEGA_BONUS;
  } else {
    if (megaWinner === "X") xBonus = MEGA_BONUS;
    else if (megaWinner === "O") oBonus = MEGA_BONUS;
  }

  return {
    x, o,
    xTotal: x + xBonus,
    oTotal: o + oBonus,
    megaWinner, megaLine,
    xMegaLines, oMegaLines,
    xBonus, oBonus,
  };
}

export const emptyGame = () => ({
  cells: Array(9).fill(null).map(() => Array(9).fill(null)),
  currentPlayer: "X",
  activeBoard: null,
  gameOver: false,
});

export function applyMove(game, mb, c, rules) {
  const { cells, currentPlayer } = game;
  if (game.gameOver) return null;
  if (cells[mb][c]) return null;
  if (game.activeBoard !== null && game.activeBoard !== mb) return null;

  const newCells = cells.map((b, i) =>
    i === mb ? b.map((v, j) => j === c ? currentPlayer : v) : b
  );

  const nextPlayer = currentPlayer === "X" ? "O" : "X";
  const targetFull = isFull(newCells[c]);
  const gameEnds = targetFull && (rules?.completedBoard ?? "end") === "end";

  return {
    newGame: {
      cells: newCells,
      currentPlayer: nextPlayer,
      activeBoard: targetFull ? null : c,
      gameOver: gameEnds,
    },
    gameEnded: gameEnds,
  };
}
