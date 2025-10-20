import { useMageStore } from '@/stores/mage';
import { armyUpkeep, buildingUpkeep, geldIncome, populationIncome, recruitUpkeep } from 'engine/src/interior';
import { enchantmentUpkeep, manaIncome } from 'engine/src/magic';
import { computed } from 'vue';

/**
 * Proxy for common engine functionalities
**/
export const useEngine = () => {
  const mageStore = useMageStore();
  const mage = computed(() => mageStore.mage)

  const productionStatus = computed(() => {
    if (!mage.value) {
      return { mana: 0, geld: 0, population: 0 };
    }

    const geld = geldIncome(mage.value);
    const mana = manaIncome(mage.value);
    const population = populationIncome(mage.value);
    return { geld, mana, population };
  });

  const armyUpkeepStatus = computed(() => {
    if (!mage.value) {
      return { mana: 0, geld: 0, population: 0 };
    }
    return armyUpkeep(mage.value);
  });

  const recruitUpkeepStatus = computed(() => {
    if (!mage.value) {
      return { mana: 0, geld: 0, population: 0 };
    }
    return recruitUpkeep(mage.value);
  });

  const buildingUpkeepStatus = computed(() => {
    if (!mage.value) {
      return { mana: 0, geld: 0, population: 0 };
    }
    return buildingUpkeep(mage.value);
  });
  
  const enchantmentUpkeepStatus = computed(() => {
    if (!mage.value) {
      return { mana: 0, geld: 0, population: 0 };
    }
    return enchantmentUpkeep(mage.value);
  });

  const netUpkeepStatus = computed(() => {
    const geld = productionStatus.value.geld
      - armyUpkeepStatus.value.geld 
      - buildingUpkeepStatus.value.geld
      - enchantmentUpkeepStatus.value.geld
      - recruitUpkeepStatus.value.geld;

    const mana = productionStatus.value.mana
      - armyUpkeepStatus.value.mana
      - buildingUpkeepStatus.value.mana
      - enchantmentUpkeepStatus.value.mana
      - recruitUpkeepStatus.value.mana;

    const population = productionStatus.value.population
      - armyUpkeepStatus.value.population
      - buildingUpkeepStatus.value.population
      - enchantmentUpkeepStatus.value.population
      - recruitUpkeepStatus.value.population;

    return { geld, mana, population };
  });


  return {
    productionStatus,
    armyUpkeepStatus,
    recruitUpkeepStatus,
    buildingUpkeepStatus,
    enchantmentUpkeepStatus,
    netUpkeepStatus
  }
}
