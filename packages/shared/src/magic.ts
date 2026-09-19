import { z } from "zod";
import { AnyEffectSchema } from "../src/effects";

const UpkeepSchema = z.object({
  geld: z.number(),
  mana: z.number(),
  population: z.number(),
});

export const SpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  magic: z.string(),
  rank: z.string(),
  attributes: z.array(z.string()),
  researchCost: z.number(),
  castingCost: z.number(),
  castingTurn: z.number(),
  life: z.number().optional(),
  upkeep: UpkeepSchema.nullable(),
  effects: z.array(AnyEffectSchema),

  // For dev purpose
  disabled: z.boolean().optional(),
});

export type Spell = z.infer<typeof SpellSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  attributes: z.array(z.string()),
  weight: z.number(),
  chargeTurns: z.number(), // not used
  upkeep: UpkeepSchema.nullable(),
  effects: z.array(AnyEffectSchema),
});

export type Item = z.infer<typeof ItemSchema>;
