<template>
  <div>Recruitment</div>

  <table v-if="mageStore.mage">
    <tr>
      <td> Name </td>
      <td> Cost </td>
      <td> Upkeep </td>
      <td> Max/Turn </td>
    </tr>
    <tr v-for="(unit) of recruitableUnits">
      <td> {{ unit.name }} </td>
      <td class="text-right"> {{ resourceDisplay(unit.recruitCost) }} </td>
      <td class="text-right"> {{ resourceDisplay(unit.upkeepCost) }} </td>
      <td class="text-right"> {{ recruitmentAmount(mageStore.mage, unit.id) }} </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getRecruitableUnits } from 'engine/src/base/references'; 
import { recruitmentAmount } from 'engine/src/interior';

const mageStore = useMageStore();
const recruitableUnits = ref<Unit[]>([]);
recruitableUnits.value = getRecruitableUnits('ascendant');


const resourceDisplay = (v: any) => {
  return `${v.geld.toFixed(2)}/${v.mana.toFixed(2)}/${v.population.toFixed(2)}`;
};


</script>

<style scoped>
</style>
