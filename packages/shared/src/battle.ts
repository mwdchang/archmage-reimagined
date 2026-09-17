import { z } from "zod";
import { UnitSchema, UnitAbilitySchema } from "./unit";
import { ArmyUnitSchema } from "./mage";
import { StackType } from "./common";

export const AppliedEffectSchema = z.object({
  origin: z.string(),
  id: z.string(),
  type: z.enum(["item", "spell", "enchantment", "skill"]),
});

export const BattleStackSchema = z.object({
  unit: UnitSchema,
  size: z.number(),

  stackType: z.nativeEnum(StackType),
  role: z.string(),

  isTemporary: z.boolean(),

  isTarget: z.boolean(),
  targetIdx: z.number(),

  // Battle calcs
  accuracy: z.number(),
  efficiency: z.number(),
  sustainedDamage: z.number(),
  loss: z.number(),

  healingPoints: z.number(),
  healingUnits: z.number(),
  healingBuffer: z.array(z.number()),

  // Temporary buffer to sort out conflicting effects from items/spells
  addedAbilities: z.array(UnitAbilitySchema),
  removedAbilities: z.array(UnitAbilitySchema),

  // For faster calculation
  netPower: z.number(),

  // Tracks what effects have been applied onto the stack
  appliedEffects: z.array(AppliedEffectSchema),
});

export type BattleStack = z.infer<typeof BattleStackSchema>;


export const BattleReportSummarySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  attackType: z.string(),

  attackerId: z.number(),
  attackerName: z.string(),
  attackerPowerLoss: z.number(),
  attackerPowerLossPercentage: z.number(),
  attackerStartingUnits: z.number(),
  attackerUnitsLoss: z.number(),

  defenderId: z.number(),
  defenderName: z.string(),
  defenderPowerLoss: z.number(),
  defenderPowerLossPercentage: z.number(),
  defenderStartingUnits: z.number(),
  defenderUnitsLoss: z.number(),

  isSuccessful: z.boolean(),
  isDefenderDefeated: z.boolean(),
  landGain: z.number(),
  landLoss: z.number(),
  spellsDispelled: z.array(z.string()),
});

export type BattleReportSummary = z.infer<typeof BattleReportSummarySchema>;


export const BattleSpellResultSchema = z.enum([
  "success",
  "lostConcentration",
  "barriers",
  "reflected",
  "noMana",
  "notUsed",
  "missed",
  "noSpell",
]).nullable();

export type BattleSpellResult = z.infer<typeof BattleSpellResultSchema>;


export const BattleItemResultSchema = z.enum([
  "success",
  "barriers",
  "noItem",
  "notUsed",
  "missed",
]).nullable();

export type BattleItemResult = z.infer<typeof BattleItemResultSchema>;


export const BattleEffectLogSchema = z.object({
  id: z.number(),
  unitId: z.string(),
  effectType: z.string(),
  value: z.unknown(),
  objId: z.string().optional(),
});

export type BattleEffectLog = z.infer<typeof BattleEffectLogSchema>;


export const EngagementParticipantSchema = z.object({
  id: z.number(),
  unitId: z.string(),
  unitsLoss: z.number(),
});

export const EngagementLogSchema = z.object({
  type: z.string(),
  attacker: EngagementParticipantSchema,
  defender: EngagementParticipantSchema,
});

export type EngagementLog = z.infer<typeof EngagementLogSchema>;


export const BattleUnitSummarySchema = z.object({
  id: z.number(),
  unitId: z.string(),
  unitsLoss: z.number(),
  unitsHealed: z.number(),
});


export const BattleSideSchema = z.object({
  id: z.number(),
  name: z.string(),
  spellId: z.string().nullable(),
  itemId: z.string().nullable(),
  army: z.array(BattleStackSchema),
});


export const BattlePreBattleSchema = z.object({
  attacker: z.object({
    spellResult: BattleSpellResultSchema,
    itemResult: BattleItemResultSchema,
  }),
  defender: z.object({
    spellResult: BattleSpellResultSchema,
    itemResult: BattleItemResultSchema,
  }),
  logs: z.array(BattleEffectLogSchema),
});


export const BattleEngagementSchema = z.object({
  logs: z.array(EngagementLogSchema),
});


export const BattlePostBattleSchema = z.object({
  unitSummary: z.array(BattleUnitSummarySchema),
  logs: z.array(z.unknown()),
});


export const BattleResultSideSchema = z.object({
  startNetPower: z.number(),
  endNetPower: z.number(),
  armyNetPower: z.number(),
  armyNetPowerLoss: z.number(),
  startingUnits: z.number(),
  unitsLoss: z.number(),
  armyLoss: z.array(ArmyUnitSchema),
});


export const BattleResultSchema = z.object({
  isSuccessful: z.boolean(),
  isDefenderDefeated: z.boolean(),
  landGain: z.number(),
  landLoss: z.number(),

  attacker: BattleResultSideSchema,
  defender: BattleResultSideSchema,

  spellsDispelled: z.array(z.string()),
});


export const BattleReportSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  attackType: z.string(),
  isSuccessful: z.boolean(),

  attacker: BattleSideSchema,
  defender: BattleSideSchema,

  preBattle: BattlePreBattleSchema,

  engagement: BattleEngagementSchema,

  postBattle: BattlePostBattleSchema,

  result: BattleResultSchema,

  landResult: z.object({
    landLoss: z.unknown(),
    landGain: z.unknown(),
  }),
});

export type BattleReport = z.infer<typeof BattleReportSchema>;

