import type { Effect } from "../src/effects";

export interface Skill {
  id: string;
  name: string;
  magic: string;
  description: string;
  maxLevel: number;
  prereqs: {
    [k: string]: number
  } | {},
  effects: Effect[];
}

export interface SkillGraph {
  id: string;
  name: string;
  nodes: Skill[];
}

