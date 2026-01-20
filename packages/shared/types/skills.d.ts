import { AllowedMagic } from "./common.js";
import type { Effect } from "../types/effects.d.ts";

export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  prereqs: {
    [k: string]: number
  },
  effects: Effect<any>[];
}

export interface SkillGraph {
  id: string;
  name: string;
  nodes: Skill[];
}
