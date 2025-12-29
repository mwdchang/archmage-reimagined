import { EffectOrigin, WishEffect } from "shared/types/effects";
import { Mage } from "shared/types/mage";
import { betweenInt, randomWeighted, WeightEntry } from "../random";
import { getRandomItem } from "../base/references";


export interface WishEffectResult {
  effectType: 'WishEffect',
  id: number,
  name: string,
  results: {
    target?: string,
    value?: number,
  }[]
}

export const applyWishEffect = async (
  mage: Mage,
  effect: WishEffect,
  origin: EffectOrigin,

  // Kind of a hack in order to access DataAdapter, we need this for things that
  // do not only exist at the mage level, such as unque-items which requires the 
  // global unique pool to be updated as well.
  uniqueItemHook: (mage: Mage) => Promise<null|string> 
) => {
  let num = 1;
  if (effect.trigger) {
    num = betweenInt(effect.trigger.min, effect.trigger.max);
  }

  // normalize and create weight table
  const rolls = effect.rolls;
  let totalWeight = 0;
  let weightTable: WeightEntry[] = [];

  for (let i = 0; i < rolls.length; i++) {
    totalWeight += rolls[i].weight;
  }
  for (let i = 0; i < rolls.length; i++) {
    weightTable.push({
      value: i,
      weight: 100 * (rolls[i].weight / totalWeight)
    });
  }
  weightTable.sort((a, b) => b.weight - a.weight);

  const wishResult: WishEffectResult = {
    effectType: 'WishEffect',
    id: mage.id,
    name: mage.name,
    results: []
  }

  // apply
  for (let i = 0; i < num; i++) {
    const index = randomWeighted(weightTable);
    const roll = rolls[index];
    const target = roll.target;
    let value = betweenInt(roll.min, roll.max);

    if (target === 'geld') {
      if (mage.currentGeld + value < 0) {
        value = -mage.currentGeld;
      }
      mage.currentGeld += value;

      wishResult.results.push({
        target: 'geld', 
        value: value
      });
      console.log(`You ${value < 0 ? 'lost' : 'gained'} ${Math.abs(value)} geld`);
    } else if (target === 'mana') {
      if (mage.currentMana + value < 0) {
        value = -mage.currentMana;
      }
      mage.currentMana += value;

      wishResult.results.push({
        target: 'mana', 
        value: value
      });
      console.log(`You ${value < 0 ? 'lost' : 'gained'} ${Math.abs(value)} mana`);
    } else if (target === 'population') {
      if (mage.currentPopulation + value < 0) {
        value = -mage.currentPopulation;
      }
      mage.currentPopulation += value;

      wishResult.results.push({
        target: 'population', 
        value: value
      });
      console.log(`You ${value < 0 ? 'lost' : 'gained'} ${Math.abs(value)} population`);
    } else if (target === 'turn') {
      if (mage.currentTurn + value < 0) {
        value = -mage.currentTurn;
      }
      mage.currentTurn += value;
      
      wishResult.results.push({
        target: 'turn', 
        value: value
      });
      console.log(`You ${value < 0 ? 'lost' : 'gained'} ${Math.abs(value)} turns`);
    } else if (target === 'item') {
      const item = getRandomItem();
      for (let idx = 0; idx < value; idx++) {
        if (!mage.items[item.id]) {
          mage.items[item.id] = 1;
        } else {
          mage.items[item.id] ++;
        }
      }

      wishResult.results.push({
        target: item.id,
        value: value
      });
      console.log(`You gained ${Math.abs(value)} ${item.id}`);
    } else if (target === 'uniqueItem') {
      const result = await uniqueItemHook(mage);

      if (result === null) {
        wishResult.results.push({
          target: null,
          value: null
        });
      } else {
        wishResult.results.push({
          target: result,
          value: 1
        });
      }
    } else if (target === null) {
      wishResult.results.push({
        target: null,
        value: null
      });
      console.log('nothing happened');
    } else {
      throw new Error(`Wish target ${target} not supported`);
    }
  }
  return wishResult;
}

