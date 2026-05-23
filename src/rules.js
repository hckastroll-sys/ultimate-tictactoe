export const UNLOCK_ALL = true; // set to false to re-enable locks for production

export const DEFAULT_RULES = {
  completedBoard: "end",   // "end" | "free_turn"
  megaBonus: "first",      // "first" | "all_unique"
  timeLimit: null,         // null | 30 | 60  (locked)
  steal: false,            // (locked)
  sessionPoints: null,     // null | number — cumulative score threshold
  sessionMinutes: null,    // null | 1 | 2 | 3 | 4 | 5
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
    key: "sessionPoints",
    label: "First to … pts",
    type: "number",
    description: "End the session when a player's cumulative score across all games reaches this total. Leave blank to disable.",
    locked: false,
  },
  {
    key: "sessionMinutes",
    label: "Session time",
    description: "End the session after this many minutes — mid-game if necessary — with the current leader declared the winner.",
    options: [
      { value: null, label: "Off"   },
      { value: 1,    label: "1 min" },
      { value: 2,    label: "2 min" },
      { value: 3,    label: "3 min" },
      { value: 4,    label: "4 min" },
      { value: 5,    label: "5 min" },
    ],
    locked: false,
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
