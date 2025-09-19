import type { AllowedMagic } from './common.d.ts'

export interface ArmyUnit {
  id: string; // Refers to unit ids
  size: number;
}

export interface Assignment {
  spellId: string,
  spellCondition: number,

  itemId: string,
  itemCondition: number,
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
  id: string; // instance id
  rank?: number; // populated as needed

  casterId: number;
  casterMagic: string;
  targetId: number;

  spellId: string;
  spellMagic: string; // not used???
  spellLevel: number;

  isEpidemic: boolean;
  isPermanent: boolean;
  life: number;
}

export interface Mage {
  id: number;
  name: string;
  rank?: number;
  status: string;
  type: string;

  // magic
  magic: string;
  testingSpellLevel: number; // For testing only

  // FIXME: customize adjacent/opposite alignment
  adjacent: string[];
  opposite: string[];

  spellbook: {
    [k in AllowedMagic]: string[]
  },

  currentResearch: {
    [k in AllowedMagic]: ResearchItem | null
  },
  
  focusResearch: boolean,

  netPower: number;

  currentTurn: number;
  maxTurn: number;
  turnsUsed: number,

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
  guilds: number;
  forts: number;
  barriers: number;
  wilderness: number;

  assignment: Assignment;

  recruitments: ArmyUnit[];
  army: ArmyUnit[];
  items: { [key: string]: number },
  heroes: Hero[];
  enchantments: Enchantment[];
}

export interface Combatant {
  mage: Mage,
  spellId: string,
  itemId: string,

  // Army sent into battle, this is different than mage.army as you don't send all stacks
  army: ArmyUnit[], 
}

