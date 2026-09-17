import { z } from "zod";
import { AllowedMagicSchema } from "./common";
import { allowedEffect as E } from "./common";
import { UnitFilterSchema } from "./unit";

export interface EffectOrigin {
  id: number,
  magic: string,
  netPower?: number, // FIXME: not optionsl ??

  spellLevel: number,
  targetId: number,
}


export const EffectSchema = z.object({
  effectType: z.string(),
});
export type Effect = z.infer<typeof EffectSchema>;


const TemporaryUnitEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.TemporaryUnitEffect),
  checkResistance: z.literal(false),
  unitId: z.string(),
  rule: z.enum(['spellLevelPercentageBase', 'fixed']),
  target: z.enum(['population']).nullable(),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.object({
        min: z.number(),
        max: z.number(),
      }),
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type TemporaryUnitEffect = z.infer<typeof TemporaryUnitEffectSchema>;


/**
 * add:                          value
 * addPercentageBase:            value * base
 * addSpellLevel:                value * spellLevel
 * addSpellLevelPercentage:      value * spellLevel / maxSpellLevel  
 * addSpellLevelPercentageBase:  value * spellLevel / maxSpellLevel * base
**/
export const UnitAttrEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.UnitAttrEffect),
  checkResistance: z.boolean(),
  activation: z.enum(['attack', 'defence']).optional(),
  attributes: z.record(
    z.string(),
    z.object({
      rule: z.enum([
        'set',
        'add',
        'remove',
        'addPercentageBase',
        'addSpellLevel',
        'addSpellLevelPercentage',
        'addSpellLevelPercentageBase',
      ]),
      magic: z.partialRecord(
        AllowedMagicSchema,
        z.object({
          value: z.any()
        })
      ).refine((magic) => Object.keys(magic).length > 0, {
        message: 'At least one magic type is required',
      })
    })
  ),
});
export type UnitAttrEffect = z.infer<typeof UnitAttrEffectSchema>;


/**
 * direct: damage = value
 * spellLevel: damage = spellLevel * value
 * spellLevelUnitLoss: unitloss = spellLevel * value
 * spellLevelUnitDamage: damage = numUnits * spellLevel * value
**/
export const DamageValueSchema = z.object({
  min: z.number(),
  max: z.number(),
});
export const UnitDamageEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.UnitDamageEffect),
  checkResistance: z.boolean(),
  damageType: z.array(z.string()),
  rule: z.enum([
    'direct',
    'unitLoss',
    'spellLevel',
    'spellLevelUnitLoss',
    'spellLevelUnitDamage',
  ]),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: DamageValueSchema,
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type UnitDamageEffect = z.infer<typeof UnitDamageEffectSchema>;


export const UnitHealEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.UnitHealEffect),
  checkResistance: z.boolean(),
  healType: z.enum(['points', 'percentage', 'units']),
  rule: z.enum(['none', 'spellLevel']),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.number(),
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type UnitHealEffect = z.infer<typeof UnitHealEffectSchema>;






/**
 * Summon units
 *
 * spellLevel = summonNetPower * randomn * currentSpellLevel / maxSpellLevel
 * fixed = summonNetPower 
**/
export const UnitSummonEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.UnitSummonEffect),
  unitIds: z.array(z.string()),
  summonType: z.enum(['random', 'all']),
  rule: z.enum(['spellLevel', 'fixed', 'power']),
  summonNetPower: z.number(),

  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.number(),
    }).refine((magic) => Object.keys(magic).length > 0, {
      message: 'At least one magic type is required',
    })
  ),
});
export type UnitSummonEffect = z.infer<typeof UnitSummonEffectSchema>;



export const KingdomResistanceEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.KingdomResistanceEffect),
  rule: z.literal('spellLevel'),
  resistance: z.string(),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.number(),
    }).refine((magic) => Object.keys(magic).length > 0, {
      message: 'At least one magic type is required',
    })
  ),
});
export type KingdomResistanceEffect = z.infer<typeof KingdomResistanceEffectSchema>;



export const KingdomBuildingsEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.KingdomBuildingsEffect),
  rule: z.enum([
    'landPercentageLoss',
    'netPowerRanged',
    'direct',
  ]),
  target: z.string(),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.object({
        min: z.number(),
        max: z.number(),
      }),
    }).refine((magic) => Object.keys(magic).length > 0, {
      message: 'At least one magic type is required',
    })
  ),
});
export type KingdomBuildingsEffect = z.infer<typeof KingdomBuildingsEffectSchema>;


export const KingdomResourcesEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.KingdomResourcesEffect),
  rule: z.enum([
    'add',
    'addSpellLevelPercentage',
    'addSpellLevelPercentageBase',
  ]),
  target: z.enum([
    'population',
    'mana',
    'geld',
    'item',
    'turn',
  ]),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.object({
        min: z.number(),
        max: z.number(),
      }),
    }).refine((magic) => Object.keys(magic).length > 0, {
      message: 'At least one magic type is required',
    })
  ),
});
export type KingdomResourcesEffect = z.infer<typeof KingdomResourcesEffectSchema>;


export const KingdomArmyEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.KingdomArmyEffect),
  rule: z.literal('addSpellLevelPercentageBase'),
  filters: z.array(UnitFilterSchema).nullable(),
  checkResistance: z.boolean(),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.object({
        min: z.number(),
        max: z.number(),
      }),
    }).refine((magic) => Object.keys(magic).length > 0, {
      message: 'At least one magic type is required',
    })
  ),
});
export type KingdomArmyEffect = z.infer<typeof KingdomArmyEffectSchema>;


export const ProductionEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.ProductionEffect),
  rule: z.enum([
    'spellLevel',
    'addPercentageBase',
    'addSpellLevelPercentageBase',
    'add',
  ]),
  production: z.enum([
    'farms',
    'guilds',
    'mana',
    'geld',
    'population',
    'land',
    'barrack',
  ]),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.number(),
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type ProductionEffect = z.infer<typeof ProductionEffectSchema>;


/**
 * Increase or decrease army upkeep per turn
**/
export const ArmyUpkeepEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.ArmyUpkeepEffect),
  rule: z.enum([
    'addSpellLevelPercentageBase',
    'addPercentageBase',
  ]),
  filters: z.array(UnitFilterSchema).nullable(),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.object({
        geld: z.any(),
        mana: z.any(),
        population: z.any(),
      }),
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type ArmyUpkeepEffect = z.infer<typeof ArmyUpkeepEffectSchema>;


/**
 * Increase or decrease casting success of spells
 */
export const CastingEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.CastingEffect),
  rule: z.literal('spellLevel'),
  type: z.literal('castingSuccess'),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.number(),
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type CastingEffect = z.infer<typeof CastingEffectSchema>;


/**
 * Generates "things" from a random roll
**/
export const WishEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.WishEffect),

  trigger: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .nullable(),

  rolls: z.array(
    z.object({
      target: z
        .enum([
          'geld',
          'population',
          'mana',
          'turn',
          'item',
          'uniqueItem',
          'land',
        ])
        .nullable(),

      min: z.number(),
      max: z.number(),
      weight: z.number(),
    })
  ),
});
export type WishEffect = z.infer<typeof WishEffectSchema>;


export const RemoveEnchantmentEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.RemoveEnchantmentEffect),
  trigger: z.object({
    min: z.number(),
    max: z.number(),
  }),
});
export type RemoveEnchantmentEffect = z.infer<typeof RemoveEnchantmentEffectSchema>;


/**
 * The target loses between [min, max] resources, some some stealPercentage is transferred to the caster
**/
export const StealEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.StealEffect),
  rule: z.enum([
    'addSpellLevelPercentageBase',
    'addSpellLevelPercentage',
    'addPercentage',
  ]),
  target: z.enum([
    'mana',
    'geld',
    'item',
  ]),
  magic: z.record(
    AllowedMagicSchema,
    z
      .object({
        value: z.object({
          min: z.number(),
          max: z.number(),
          stealPercent: z.number().nullable(),
        }),
      })
      .optional()
  ),
});
export type StealEffect = z.infer<typeof StealEffectSchema>;

/**
 * A percentage change to avoid opponent attacks
**/
export const AvoidEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.AvoidEffect),
  target: z.enum([
    'spell',
    'item',
    'attack',
  ]),
  magic: z.record(
    AllowedMagicSchema,
    z
      .object({
        value: z.any(),
      })
      .optional()
  ),
});
export type AvoidEffect = z.infer<typeof AvoidEffectSchema>;


/**
 * Modify casting cost of spells
**/
export const CastingCostEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.CastingCostEffect),
  rule: z.literal('addPercentageBase'),
  magic: z.partialRecord(
    AllowedMagicSchema,
    z.object({
      value: z.object({
        innate: z.number(),
        adjacent: z.number(),
        opposite: z.number(),
      }),
    })
  ).refine((magic) => Object.keys(magic).length > 0, {
    message: 'At least one magic type is required',
  })
});
export type CastingCostEffect = z.infer<typeof CastingCostEffectSchema>;




export const BattleEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.BattleEffect),

  target: z.enum(['self', 'opponent', 'both']),

  targetType: z.enum([
    'all',
    'random',
    'weightedRandom',
  ]),

  filters: z.array(UnitFilterSchema).nullable(),

  trigger: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .nullable(),

  effects: z.array(
    z.union([
      UnitAttrEffectSchema,
      UnitDamageEffectSchema,
      UnitHealEffectSchema,
      TemporaryUnitEffectSchema,
    ])
  ),
});
export type BattleEffect = z.infer<typeof BattleEffectSchema>;


/**
 * Prebattle effects takes place before the armies line up. This is used to
 * - Priortize unit attribute changes, eg: set to fix number
 * - Create temporary stacks
**/
export const PrebattleEffectSchema = BattleEffectSchema.extend({
  effectType: z.literal(E.PrebattleEffect),
});
export type PrebattleEffect = z.infer<typeof PrebattleEffectSchema>;


export const PostbattleEffectSchema = EffectSchema.extend({
  effectType: z.literal(E.PostbattleEffect),
  target: z.enum(['self', 'opponent']),
  condition: z.enum(['win', 'lose', 'all']),
  activation: z.enum(['attack', 'defence']).optional(),
  effects: z.array(
    z.union([
      KingdomResourcesEffectSchema,
      StealEffectSchema,
      KingdomBuildingsEffectSchema,
    ])
  ),
});

export type PostbattleEffect = z.infer<typeof PostbattleEffectSchema>;



export const AnyEffectSchema = z.discriminatedUnion('effectType', [
  TemporaryUnitEffectSchema,
  UnitAttrEffectSchema,
  UnitDamageEffectSchema,
  UnitHealEffectSchema,
  UnitSummonEffectSchema,
  KingdomResistanceEffectSchema,
  KingdomBuildingsEffectSchema,
  KingdomResourcesEffectSchema,
  KingdomArmyEffectSchema,
  ProductionEffectSchema,
  ArmyUpkeepEffectSchema,
  CastingEffectSchema,
  WishEffectSchema,
  RemoveEnchantmentEffectSchema,
  StealEffectSchema,
  AvoidEffectSchema,
  CastingCostEffectSchema,
  BattleEffectSchema,
  PrebattleEffectSchema,
  PostbattleEffectSchema
]);
