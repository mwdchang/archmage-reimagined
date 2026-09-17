import { z } from "zod";
import { AllowedAttackTypesSchema, AllowedMagicSchema } from "./common";

const SpellResistancesSchema = z.record(
  AllowedMagicSchema,
  z.number().min(0).max(100)
);

const AttackResistancesSchema = z.record(
  AllowedAttackTypesSchema,
  z.number().min(0).max(100)
);

const UnitCostSchema = z.object({
  geld: z.number(),
  mana: z.number(),
  population: z.number(),
});


const UnitAbilitySchema = z.object({
  name: z.string(),
  extra: z.unknown().optional(),
});


export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  magic: z.string(),
  powerRank: z.number().positive(),

  race: z.array(z.string()),
  attributes: z.array(z.string()),

  // Attacks
  primaryAttackPower: z.number(),
  primaryAttackType: z.array(z.string()),
  primaryAttackInit: z.number(),

  secondaryAttackPower: z.number(),
  secondaryAttackType: z.array(z.string()),
  secondaryAttackInit: z.number(),

  counterAttackPower: z.number(),

  hitPoints: z.number(),

  recruitCost: UnitCostSchema,
  upkeepCost: UnitCostSchema,

  abilities: z.array(UnitAbilitySchema),

  spellResistances: SpellResistancesSchema,
  attackResistances: AttackResistancesSchema,
});

export type Unit = z.infer<typeof UnitSchema>;


const NumberFilterExprSchema = z.object({
  op: z.enum(['gte', 'lte']),
  value: z.number(),
});

export const UnitFilterSchema = z.object({
  magic: z.array(z.string()).optional(),
  race: z.array(z.string()).optional(),

  primaryAttackPower: NumberFilterExprSchema.optional(),
  primaryAttackType: z.array(z.string()).optional(),
  primaryAttackInit: NumberFilterExprSchema.optional(),

  secondaryAttackPower: NumberFilterExprSchema.optional(),
  secondaryAttackType: z.array(z.string()).optional(),
  secondaryAttackInit: NumberFilterExprSchema.optional(),

  counterAttackPower: NumberFilterExprSchema.optional(),

  hitPoints: NumberFilterExprSchema.optional(),

  abilities: z.array(z.string()).optional(),

  // extra
  allAttackType: z.array(z.string()).optional(),
});
export type UnitFilter = z.infer<typeof UnitFilterSchema>;


export interface UnitAbility {
  name: string,
  extra?: any
}

