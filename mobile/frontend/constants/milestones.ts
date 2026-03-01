// milestones.ts
// Each milestone is a "boss" or themed character the player walks toward on the path.
// xpRequired = total XP needed to REACH this milestone node.

export type Milestone = {
  id: string;
  xpRequired: number;
  label: string;
  character: string; // emoji used in pixel art head
  title: string;     // displayed under the node
  description: string;
  rewardHint: string;
  color: string;     // accent color for this node
  unlockItem?: string; // ShopItem id unlocked on reach
};

export const MILESTONES: Milestone[] = [
  {
    id: "START",
    xpRequired: 0,
    label: "You",
    character: "🧑",
    title: "Fresh Recruit",
    description: "Welcome to UTM Campus Quest. Your journey begins.",
    rewardHint: "Complete your first quest to move forward.",
    color: "#7fd0ff",
  },
  {
    id: "LIBRARY_GHOST",
    xpRequired: 50,
    label: "Library Ghost",
    character: "👻",
    title: "The Library Ghost",
    description: "Haunts the 4th floor of Hazel McCallion. Knows where every textbook is hidden.",
    rewardHint: "Unlocks: Spectral Hood cosmetic",
    color: "#c8b4ff",
    unlockItem: "HAT_GHOST",
  },
  {
    id: "MN_WARRIOR",
    xpRequired: 150,
    label: "MN Warrior",
    character: "⚔️",
    title: "MN Warrior",
    description: "A legendary figure who has survived every MN course. Carries a calculator like a sword.",
    rewardHint: "Unlocks: MN Battle Armour cosmetic",
    color: "#ffd27f",
    unlockItem: "ARMOUR_MN",
  },
  {
    id: "CCT_HACKER",
    xpRequired: 300,
    label: "CCT Hacker",
    character: "💻",
    title: "The CCT Hacker",
    description: "Coded their first app in the CCT building. Speaks only in Stack Overflow links.",
    rewardHint: "Unlocks: Hacker Hoodie cosmetic",
    color: "#74ffb0",
    unlockItem: "HOODIE_CCT",
  },
  {
    id: "PROF_BAILEY",
    xpRequired: 500,
    label: "Prof. Bailey",
    character: "🧑‍🏫",
    title: "Prof. Bailey Glazer",
    description: "The legend. Has handed out more feedback than any mortal should. Respects effort.",
    rewardHint: "Unlocks: Professor Cap cosmetic",
    color: "#ff9f7f",
    unlockItem: "HAT_PROF",
  },
  {
    id: "UTM_CHAMPION",
    xpRequired: 750,
    label: "UTM Champion",
    character: "🏆",
    title: "UTM Campus Champion",
    description: "Completed every trail. Known across all of UTM. The map bows to you.",
    rewardHint: "Unlocks: Champion Crown cosmetic",
    color: "#ffd700",
    unlockItem: "HAT_CROWN",
  },
];

export function getCurrentMilestone(xp: number): Milestone {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (xp >= m.xpRequired) current = m;
    else break;
  }
  return current;
}

export function getNextMilestone(xp: number): Milestone | null {
  for (const m of MILESTONES) {
    if (xp < m.xpRequired) return m;
  }
  return null;
}

export function getProgressToNext(xp: number): number {
  const current = getCurrentMilestone(xp);
  const next = getNextMilestone(xp);
  if (!next) return 1;
  const range = next.xpRequired - current.xpRequired;
  const earned = xp - current.xpRequired;
  return Math.min(1, earned / range);
}