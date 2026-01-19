import { AllowedMagic } from "./common.js";
import type { Effect } from "../types/effects.d.ts";

interface Prereq {
  id: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  prereqs: Prereq[];
  effects: Effect<any>[];
}

export interface SkillGraph {
  id: string;
  name: string;
  nodes: Skill[];
}
