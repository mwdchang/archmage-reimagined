import { GameMsg } from "shared/types/common";
import { WishEffectResult } from "./effects/apply-wish-effect";
import { StealEffectResult } from "./effects/apply-steal-effect";
import { KingdomResourcesEffectResult } from "./effects/apply-kingdom-resources";
import { KingdomBuildingsEffectResult } from "./effects/apply-kingdom-buildings";
import { KingdomArmyEffectResult } from "./effects/apply-kingdom-army-effect";
import { RemoveEnchantmentEffectResult } from "./effects/apply-remove-enchantment-effect";

export const fromRemoveEnchantmentEffectResult = (
  result: RemoveEnchantmentEffectResult
) => {
  const logs: GameMsg[] = [];
  logs.push({
    type: 'log',
    message: result.targetId ?
      `You purified ${result.targetName} (#${result.targetId})` :
      `You purified yourself`
  });
  return logs;
}

export const fromWishEffectResult = (result: WishEffectResult): GameMsg[] => {
  const logs: GameMsg[] = [];
  for (const r of result.results) {
    logs.push({
      type: 'log',
      message: `${result.name} (#${result.id}) ${r.value < 0 ? 'lost' : 'gained'} ${Math.abs(r.value)} ${r.target}`
    })
  }
  return logs;
}

export const fromStealEffectResult = (result: StealEffectResult): GameMsg[] => {
  const logs: GameMsg[] = [];
  logs.push({
    type: 'log', 
    message: `${result.name} (#${result.targetId}) lost ${result.lossValue} ${result.target} ,you stole ${result.stealValue} ${result.target}.`
  });
  return logs;
}

export const fromKingdomResourcesEffectResult = (result: KingdomResourcesEffectResult): GameMsg[] => {
  const logs: GameMsg[] = [];
  const dir = result.value < 0 ? 'lost' : 'gained';
  logs.push({
    type: 'log',
    message: `${result.name} (#${result.id}) ${dir} ${Math.abs(result.value)} ${result.target}`
  });
  return logs;
}

export const fromKingdomBuildingsEffectResult = (result: KingdomBuildingsEffectResult): GameMsg[] => {
  const logs: GameMsg[] = [];
  for (const key of Object.keys(result.buildings)) {
    const v = result.buildings[key];
    if (v === 0) continue;
    const dir = v < 0 ? 'lost' : 'gained';
    logs.push({
      type: 'log',
      message: `${result.name} (#${result.id}) ${dir} ${Math.abs(v)} ${key}`
    });
  }
  return logs;
}

export const fromKingdomArmyEffectResult = (result: KingdomArmyEffectResult): GameMsg[] => {
  const logs: GameMsg[] = [];
  for (const key of Object.keys(result.army)) {
    const v = result.army[key];
    const dir = v < 0 ? 'lost' : 'gained';
    logs.push({
      type: 'log',
      message: `${result.name} (#${result.id}) ${dir} ${Math.abs(v)} ${key}`
    });
  }
  return logs;
}
