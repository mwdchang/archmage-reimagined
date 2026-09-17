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


export const ServerClockSchema = z.object({
  interval: z.number(),
  currentTurn: z.number(),
  currentTurnTime: z.number(),
  startTime: z.number(),
  endTurn: z.number(),
});
export type ServerClock = z.infer<typeof ServerClockSchema>;


export const MageRankSchema = z.object({
  id: z.number(),
  name: z.string(),
  magic: z.string(),
  forts: z.number(),
  turns: z.number(),
  land: z.number(),
  status: z.string(),
  netPower: z.number(),
  rank: z.number(),
});
export type MageRank = z.infer<typeof MageRankSchema>;



export const GameTableSchema = z.object({
  explorationLimit: z.number(),
  maxTurns: z.number(),
  turnRate: z.number(),
  endTurn: z.number(),
  apprenticeTurn: z.number(),

  itemGenerationRate: z.number(),

  war: z.object({
    obfuscateReport: z.boolean(),
    damagedPercentage: z.number(),
    window: z.number(), // In hours

    range: z.object({
      min: z.number(),
      max: z.number(),
    }),
  }),

  blackmarket: z.object({
    minimum: z.number(),
    commission: z.number(),
    priceIncreaseFactor: z.number(),
    priceDecreaseFactor: z.number(),
    sellingTimeOnMarket: z.number(),
  }),
});

export type GameTable = z.infer<typeof GameTableSchema>;


export const ChronicleTurnSchema = z.object({
  id: z.number(),
  name: z.string(),
  turn: z.number(),
  timestamp: z.number(),

  // FIXME: string for now, maybe structured
  data: z.array(z.any()),
});

export type ChronicleTurn = z.infer<typeof ChronicleTurnSchema>;


export const GameMsgSchema = z.object({
  type: z.string(),
  message: z.string(),
});

export type GameMsg = z.infer<typeof GameMsgSchema>;


export const MailSchema = z.object({
  id: z.string(),
  type: z.enum(['market', 'guild', 'normal']),
  priority: z.number(),
  timestamp: z.number(),

  source: z.number(),
  target: z.number(),

  subject: z.string(),
  content: z.string(),
  read: z.boolean(),
});

export type Mail = z.infer<typeof MailSchema>;

