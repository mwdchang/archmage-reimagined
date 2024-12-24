<template>
  <table v-if="mageStore.mage">
    <tbody>
      <tr>
        <td> Name </td>
        <td> Upkeep </td>
        <td> Number </td>
        <td> Power </td>
        <td> &nbsp; </td>
        <td> &nbsp; </td>
        <td> Disband </td>
      </tr>
      <tr v-for="(u) of unitsStatus" :key="u.id">
        <td> 
          <router-link :to="{ name: 'viewUnit', params: { id: u.id }}"> {{ u.name }} </router-link>
        </td>
        <td class="text-right"> {{ u.upkeep.geld }} / {{ u.upkeep.mana }} / {{ u.upkeep.population }} </td>
        <td class="text-right" style="padding-left: 10px"> {{ u.size }} </td>
        <td class="text-right"> {{ (100 * u.powerPercentage).toFixed(2) }}%</td>
        <td style="font-size: 125%"> + </td>
        <td style="font-size: 125%"> - </td>
        <td>
          <input type="text" size=12>
        </td>
      </tr>
    </tbody>
  </table>

  <span>
    <label>Disband confirmation&nbsp;</label><input type="checkbox" v-model="confirmDisband"> 
  </span>

  <button @click="">Disband units</button>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getArmy, ArmyItem } from '@/util/util';
import { getUnitById } from 'engine/src/base/references';
import { npMultiplier } from 'engine/src/base/unit';

const confirmDisband = ref(false);

interface DisbandArmyItem extends ArmyItem {
  moveUp: number;
  moveDown: number;
  disbandAmount: number;
};

const mageStore = useMageStore();

const unitsStatus = computed<DisbandArmyItem[]>(() => {
  if (!mageStore.mage) return []
  let rawArmy = getArmy(mageStore.mage);

  const armyItems = rawArmy.sort((a, b) => b.power - a.power);
  // return rawArmy.sort((a, b) => b.power - a.power);

  return armyItems.map((armyItem, index) => {
    let moveUp = 0;
    let moveDown = 0;

    // amount of units to move up
    if (index > 0) { 
      const unitToAdjust = getUnitById(armyItems[index].id);
      const power = Math.abs(armyItems[index - 1].power - armyItems[index].power);
      const multiplier = npMultiplier(unitToAdjust);
      const num = Math.ceil(power / (multiplier * unitToAdjust.powerRank));
      moveUp = num;
    }

    // amount of units to move down
    if (index < armyItems.length - 1) {
      const unitToAdjust = getUnitById(armyItems[index].id);
      const power = Math.abs(armyItems[index].power - armyItems[index + 1].power);
      const multiplier = npMultiplier(unitToAdjust);
      const num = Math.ceil(power / (multiplier * unitToAdjust.powerRank));
      moveDown = num;
    }

    console.log(armyItem.id, moveUp, moveDown);
    
    return {
      ...armyItem,
      moveUp: moveUp,
      moveDown: moveDown,
      disbandAmount: 0
    };
  });
});

</script>

<style>
</style>
