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
    description: "What happens when the next board is already full.",
    options: [
      { value: "end",       label: "End game" },
      { value: "free_turn", label: "Free turn" },
    ],
    locked: false,
  },
  {
    key: "megaBonus",
    label: "Mega bonus",
    description: "Win 3 boards in a row for +3 points.",
    options: [
      { value: "first",      label: "First only (+3)" },
      { value: "all_unique", label: "Both score (+3)" },
    ],
    locked: false,
  },
  {
    key: "timeLimit",
    label: "Turn timer",
    description: "Per-turn time limit. Expiry forfeits the turn.",
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
    description: "Complete a new line in an opponent's board to claim it.",
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
    description: "Session ends when a player's total score hits this.",
    locked: false,
  },
  {
    key: "sessionMinutes",
    label: "Session time",
    description: "Session ends after this many minutes. Leader wins.",
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
    label: "Swap sides",
    description: "Alternate who moves first each game.",
    options: [
      { value: false, label: "Off" },
      { value: true,  label: "On"  },
    ],
    locked: true,
  },
];
