import _ from 'lodash';
import { Mage } from "shared/src/mage";
import { totalLand } from "../base/mage";
import { drawN } from '../random';

// Lose 10%
const siegePercentage = 0.10;

// Lose 5%
const regularPercenage = 0.05;

const unitsNeededPerAcre = 50;
const attackerGain = 0.33;

const emptyLandCounts = () => {
  return {
    farms: 0,
    towns: 0,
    workshops: 0,
    nodes: 0,
    barracks: 0,
    guilds: 0,
    forts: 0,
    barriers: 0,
    wilderness: 0
  };
}

export const calcLandLoss = (mage: Mage, attackType: string, unitsRemaining: number) => {
  const landLoss = emptyLandCounts();
  const landGain = emptyLandCounts();

  const buildingTypes = [
    'wilderness', 'farms', 'towns',
    'workshops', 'nodes', 'barracks',
    'guilds', 'barriers', 'forts'
  ];

  const takePercentage = attackType === 'siege' ? siegePercentage : regularPercenage;
  const mageLand = totalLand(mage);
  let landTaken = Math.ceil(Math.min(takePercentage * mageLand, unitsRemaining / unitsNeededPerAcre));
  // result.land = mageLand;
  // result.landTaken = landTaken;


  const tempMageBuildings = _.pick(mage, buildingTypes);

  const calcFortLoss = () => {
    // Handle forts, say 1500 units to take a fort 
    let maxFortTaken = Math.floor(unitsRemaining / 1500);
    const forts = Math.floor(Math.min(1 + 0.1 * mage.forts, maxFortTaken));
    return Math.min(forts, tempMageBuildings['forts']);
  }

  // Do forts first, then proportionally distribute over remainder building types
  landLoss.forts = calcFortLoss();
  landTaken -= landLoss.forts;

  // Do remainder
  delete tempMageBuildings['forts'];
  const lossDraws = drawN(tempMageBuildings as Record<string, number>, landTaken);

  Object.keys(lossDraws).forEach(key => {
    landLoss[key] = lossDraws[key];
  });


  landGain.forts = Math.max(1, Math.floor(attackerGain * landLoss.forts));
  buildingTypes.forEach(buildingType => {
    if (buildingType === 'forts') return;
    landGain[buildingType] = Math.floor(attackerGain * landLoss[buildingType]);
  });

  // Dump any remainder into wilderness
  let tempTotal = 0;
  buildingTypes.forEach(d => {
    tempTotal += landGain[d];
  });
  const extra = Math.floor(attackerGain * landTaken) - tempTotal;
  if (extra > 0) { landGain['wilderness'] += extra; }


  // Done
  return { landLoss, landGain };
}
