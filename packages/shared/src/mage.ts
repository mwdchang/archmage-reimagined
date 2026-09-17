import { z } from "zod";

export const ArmyUnitSchema = z.object({
  id: z.string(),
  size: z.number(),
});
export type ArmyUnit = z.infer<typeof ArmyUnitSchema>;


export const AssignmentSchema = z.object({
  spellId: z.string(),
  spellCondition: z.number(),

  itemId: z.string(),
  itemCondition: z.number(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;


export const HeroSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.number(),
  exp: z.number(),
});
export type Hero = z.infer<typeof HeroSchema>;


export const ResearchableSpellSchema = z.object({
  id: z.string(),
  researchCost: z.number(),
});
export type ResearchableSpell = z.infer<typeof ResearchableSpellSchema>;


export const UsableSpellSchema = z.object({
  id: z.string(),
  castingTurn: z.number(),
  castingCost: z.number(),
});
export type UsableSpell = z.infer<typeof UsableSpellSchema>;


export const ResearchItemSchema = z.object({
  id: z.string(),
  remainingCost: z.number(),
  active: z.boolean(),
});
export type ResearchItem = z.infer<typeof ResearchItemSchema>;


export const EnchantmentSchema = z.object({
  id: z.string(),

  casterId: z.number(),
  casterMagic: z.string(),
  targetId: z.number(),

  spellId: z.string(),
  spellLevel: z.number(),

  isEpidemic: z.boolean(),
  isPermanent: z.boolean(),
  isActive: z.boolean(),
  life: z.number(),
});
export type Enchantment = z.infer<typeof EnchantmentSchema>;


const MagicRecordSchema = z.record(
  z.string(),
  z.array(z.string()),
);

const CurrentResearchSchema = z.record(
  z.string(),
  ResearchItemSchema.nullable(),
);


export const MageSchema = z.object({
  id: z.number(),
  name: z.string(),
  rank: z.number().optional(),
  status: z.string(),
  type: z.string(),

  // magic
  magic: z.string(),
  testingSpellLevel: z.number(),

  // FIXME: customize adjacent/opposite alignment
  adjacent: z.array(z.string()),
  opposite: z.array(z.string()),

  spellbook: MagicRecordSchema,
  currentResearch: CurrentResearchSchema,

  focusResearch: z.boolean(),

  netPower: z.number(),

  currentTurn: z.number(),
  maxTurn: z.number(),
  turnsUsed: z.number(),

  // economy
  currentPopulation: z.number(),
  currentMana: z.number(),
  currentGeld: z.number(),

  // land
  farms: z.number(),
  towns: z.number(),
  workshops: z.number(),
  nodes: z.number(),
  barracks: z.number(),
  guilds: z.number(),
  forts: z.number(),
  barriers: z.number(),
  wilderness: z.number(),

  assignment: AssignmentSchema,

  recruitments: z.array(ArmyUnitSchema),
  army: z.array(ArmyUnitSchema),
  items: z.record(z.string(), z.number()),
  heroes: z.array(HeroSchema),
  enchantments: z.array(EnchantmentSchema),

  skillPoints: z.number(),
  skills: z.record(z.string(), z.number()),
});
export type Mage = z.infer<typeof MageSchema>;


export const CombatantSchema = z.object({
  mage: MageSchema,
  spellId: z.string(),
  itemId: z.string(),

  // Army sent into battle, different from mage.army
  // since you don't send all stacks
  army: z.array(ArmyUnitSchema),
});
export type Combatant = z.infer<typeof CombatantSchema>;


export const MageSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  magic: z.string(),
  rank: z.number(),
  status: z.string(),
  land: z.number(),
  netPower: z.number(),
  forts: z.number(),
});
export type MageSummary = z.infer<typeof MageSummarySchema>;
