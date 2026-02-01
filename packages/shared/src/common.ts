export const allowedMagicList = [
  'ascendant',
  'verdant',
  'eradication',
  'nether',
  'phantasm',
] as const;


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

