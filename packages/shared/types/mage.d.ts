export interface ArmyUnit {
  id: string; // Refers to unit ids
  size: number;
}

export interface Item {
  id: number;
  type: string;
}

export interface Hero {
  id: number;
  name: string;
  level: number;
  exp: number;
}

export interface ResearchableSpell {
  id: string,
  researchCost: number,
}

export interface UsableSpell {
  id: string,
  castingTurn: number,
  castingCost: number
}

export interface ResearchItem {
  id: string,
  remainingCost: number,
  active: boolean
}

export interface Enchantment {
  casterId: number,
  spellId: string,
  spellLevel: number,
  duration: number
}

export interface Mage {
  id: number;
  name: string;

  // magic
  magic: string;
  currentSpellLevel: number;
  maxSpellLevel: number;

  spellbook: {
    ascendant: string[],
    verdant: string[],
    eradication: string[],
    nether: string[],
    phantasm: string[]
  },

  currentResearch: {
    ascendant: ResearchItem | null,
    verdant: ResearchItem | null,
    eradication: ResearchItem | null,
    nether: ResearchItem | null,
    phantasm: ResearchItem | null
  },

  netPower: number;

  currentTurn: number;
  maxTurn: number;

  // economy
  currentPopulation: number;
  currentMana: number;
  currentGeld: number;

  // land
  farms: number;
  towns: number;
  workshops: number;
  nodes: number;
  barracks: number;
  libraries: number;
  fortresses: number;
  barriers: number;
  wilderness: number;

  army: ArmyUnit[];
  items: Item[];
  heroes: Hero[];
  enchantments: Enchantment[];
}
