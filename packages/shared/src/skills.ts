import { z } from "zod";
import { EffectSchema } from "../src/effects";
import { AllowedMagicSchema } from "./common";

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  magic: AllowedMagicSchema,
  description: z.string(),
  maxLevel: z.number(),
  prereqs: z.record(z.string(), z.number()),
  effects: z.array(EffectSchema),
});

export type Skill = z.infer<typeof SkillSchema>;

export const SkillGraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(SkillSchema),
});

export type SkillGraph = z.infer<typeof SkillGraphSchema>;
