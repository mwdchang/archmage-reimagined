import { EffectOrigin, KingdomBuildingsEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { getMaxSpellLevels } from "../base/references";
import { between } from "../random";
import { getBuildingTypes } from "../interior";
import { totalLand } from "../base/mage";


export interface KingdomBuildingsEffectResult {
  effectType: 'KingdomBuildingsEffect',
  id: number,
  name: string,
  buildings: { [key: string]: number }
}

export const applyKingdomBuildingsEffect = (
  mage: Mage,
  effect: KingdomBuildingsEffect,
  origin: EffectOrigin
) => {
  const spellLevel = origin.spellLevel;
  const magic = origin.magic;
  const maxSpellLevel = getMaxSpellLevels()[magic];
  const spellPowerScale = spellLevel / maxSpellLevel;
  const mageLand = totalLand(mage);

  const result: KingdomBuildingsEffectResult = {
    effectType: 'KingdomBuildingsEffect',
    id: mage.id,
    name: mage.name,
    buildings: {}
  };

  if (effect.rule === 'landPercentageLoss') {
    const { min, max } = effect.magic[magic].value as { min: number, max: number };
    const percent = between(min, max) / 100 * spellPowerScale;

    const buildingTypes = effect.target === 'all' ?
      getBuildingTypes() :
      effect.target.split(',');

    // Create buffers
    const buffer: { [key: string]: number } = {};
    let totalBuildings = 0;
    for (const buildingType of buildingTypes) {
      totalBuildings += mage[buildingType];
      buffer[buildingType] = 0;
    }

    // Distribute damage
    let counter = Math.abs(Math.ceil(mageLand * percent));
    while (counter > 0) {
      const r = Math.random() * totalBuildings;
      let acc = 0;
      for (const buildingType of buildingTypes) {
        acc += mage[buildingType];
        if (r < acc) {
          buffer[buildingType] ++;
          break;
        }
      }
      counter --;
    }

    // Resolve
    for (const buildingType of buildingTypes) {
      // Cap
      if (mage[buildingType] - buffer[buildingType] <= 0) {
        buffer[buildingType] = mage[buildingType]
      }
      mage[buildingType] -= buffer[buildingType];
      mage['wilderness'] += buffer[buildingType];

      // Need to make values negative to make messaging consistent
      result.buildings[buildingType] = -buffer[buildingType];
      console.log(`mage(#${mage.id}) ${buffer[buildingType]} ${buildingType} destroyed`);
    }
  } else {
    throw new Error(`${effect.rule} not found for KingdomBuildingsEffect`);
  }

  return result;
};
