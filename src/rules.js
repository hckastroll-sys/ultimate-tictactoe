export const UNLOCK_ALL = true; // set to false to re-enable locks for production

export const DEFAULT_RULES = {
  completedBoard: "end",   // "end" | "free_turn"
  megaBonus: "first",      // "first" | "all_unique"
  timeLimit: null,         // null | 30 | 60  (locked)
  steal: false,            // (locked)
  firstToN: null,          // null | 3 | 5    (locked)
  swapSides: false,        // (locked)
};

export const RULE_DEFS = [
  {
    key: "completedBoard",
    label: "Full board redirect",
    description: "When your move would send the opponent to a full mini-board, choose whether that ends the game or grants them a free turn to play anywhere.",
    options: [
      { value: "end",       label: "End game" },
      { value: "free_turn", label: "Free turn" },
    ],
    locked: false,
  },
  {
    key: "megaBonus",
    label: "Mega bonus",
    description: "Awards +3 points to any player who wins 3 mini-boards in a row. Choose whether only the first player to do so earns the bonus, or both players earn it if each achieves their own mega win.",
    options: [
      { value: "first",      label: "First only (+3)" },
      { value: "all_unique", label: "Both score (+3)" },
    ],
    locked: false,
  },
  {
    key: "timeLimit",
    label: "Turn timer",
    description: "Limits how long a player can deliberate each turn. If the clock runs out, the turn is forfeited and the opponent gets a free-choice move.",
    options: [
      { value: null, label: "Off" },
      { value: 30,   label: "30s" },
      { value: 60,   label: "60s" },
    ],
    locked: true,
  },
  {
    key: "steal",
    label: "Board steal",
    description: "Lets a player claim an opponent-owned mini-board by completing a new line in it. Stolen boards count toward the thief's mega win, adding a comeback mechanic.",
    options: [
      { value: false, label: "Off" },
      { value: true,  label: "On"  },
    ],
    locked: true,
  },
  {
    key: "firstToN",
    label: "Session ends",
    description: "Ends the session once one player reaches the target number of individual game wins, crowning an overall session champion.",
    options: [
      { value: null, label: "Never"      },
      { value: 3,    label: "First to 3" },
      { value: 5,    label: "First to 5" },
    ],
    locked: true,
  },
  {
    key: "swapSides",
    label: "Swap sides each game",
    description: "Alternates which player moves first at the start of each new game, balancing the inherent first-move advantage over a session.",
    options: [
      { value: false, label: "Off" },
      { value: true,  label: "On"  },
    ],
    locked: true,
  },
];
