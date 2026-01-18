import { AllowedMagic } from "./common.js";

interface Prereq {
  id: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  maxLevel: number;
  description: string;
  prereq: Prereq[];
}

export interface SkillGraph {
  id: string;
  nodes: Skill[];
}
