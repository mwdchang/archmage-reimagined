import { z } from "zod";

export const allowedMagicList = [
  'ascendant',
  'verdant',
  'eradication',
  'nether',
  'phantasm',
] as const;

export const AllowedMagicSchema = z.enum(allowedMagicList);
export type AllowedMagic = z.infer<typeof AllowedMagicSchema>;


export const allowedAttackTypeList = [
  'missile',
  'fire',
  'poison',
  'breath',
  'magic',
  'melee',
  'ranged',
  'lightning',
  'cold',
  'paralyse',
  'psychic',
  'holy'
];

export const AllowedAttackTypesSchema = z.enum(allowedAttackTypeList);



export const enum allowedEffect {
  // Container effects
  BattleEffect = 'BattleEffect',
  PrebattleEffect = 'PrebattleEffect',
  PostbattleEffect = 'PostbattleEffect',

  // Battle related
  TemporaryUnitEffect = 'TemporaryUnitEffect',
  UnitAttrEffect = 'UnitAttrEffect',
  UnitDamageEffect = 'UnitDamageEffect',
  UnitHealEffect = 'UnitHealEffect',

  // Kingdom
  KingdomResistanceEffect = 'KingdomResistanceEffect',
  ProductionEffect = 'ProductionEffect',
  ArmyUpkeepEffect = 'ArmyUpkeepEffect',
  CastingEffect = 'CastingEffect',
  CastingCostEffect = 'CastingCostEffect',
  AvoidEffect = 'AvoidEffect',
  ScryEffect = 'ScryEffect',

  // Instants
  KingdomBuildingsEffect = 'KingdomBuildingsEffect',
  KingdomResourcesEffect = 'KingdomResourcesEffect',
  KingdomArmyEffect = 'KingdomArmyEffect',
  WishEffect = 'WishEffect',
  RemoveEnchantmentEffect = 'RemoveEnchantmentEffect',
  StealEffect = 'StealEffect',
  UnitSummonEffect = 'UnitSummonEffect'
}

export enum StackType {
  NORMAL,
  REINFORCEMENT,
  TEMPORARY
}


export const BlackMarketId = -2;
export const KingdomAdvisorId = -3;


export interface AutocompleteCandidate {
  id: string;
  label: string;
}

