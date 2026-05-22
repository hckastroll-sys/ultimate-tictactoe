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
    options: [
      { value: "end",       label: "End game" },
      { value: "free_turn", label: "Free turn" },
    ],
    locked: false,
  },
  {
    key: "megaBonus",
    label: "Mega bonus",
    options: [
      { value: "first",      label: "First only (+3)" },
      { value: "all_unique", label: "Both score (+3)" },
    ],
    locked: false,
  },
  {
    key: "timeLimit",
    label: "Turn timer",
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
    options: [
      { value: false, label: "Off" },
      { value: true,  label: "On"  },
    ],
    locked: true,
  },
  {
    key: "firstToN",
    label: "Session ends",
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
    options: [
      { value: false, label: "Off" },
      { value: true,  label: "On"  },
    ],
    locked: true,
  },
];
