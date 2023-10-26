<template>
  <table v-if="mage">
    <tr>
      <td>&nbsp;</td>
      <td>Building</td>
      <td>Current</td>
      <td>% Total</td>
      <td>Cost</td>
      <td>Max/Turn</td>
      <td>Build</td>
    </tr>

    <tr v-for="(bType) of buildingTypes" :key="bType.id">
      <td>-</td>
      <td> {{ bType.id }} </td>
      <td class="text-right"> {{ mage[bType.id] }} </td>
      <td class="text-right"> {{ (100 * mage[bType.id] / land).toFixed(2) }} </td>
      <td class="text-right"> {{ bType.geldCost }} / {{ bType.manaCost }} </td>
      <td class="text-right"> {{ buildingRate(mage, bType.id).toFixed(2) }} </td>
      <td> <input type="number" v-model="userInput[bType.id]"> </td>
    </tr>
  </table>
  <div> Land required {{ summary.landUsed }}, Turns required {{ summary.turnsUsed }} </div>
  <button @click="build"> Build </button>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { buildingTypes, buildingRate } from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';

const mageStore = useMageStore();
const emit = defineEmits(['build']);
const mage = computed(() => mageStore.mage);

const land = computed(() => totalLand(mage.value));
const summary = computed(() => {
  let landUsed = 0;
  let turnsUsed = 0;

  buildingTypes.forEach(b => {
    landUsed += userInput.value[b.id];
    turnsUsed += userInput.value[b.id] /  buildingRate(mage.value, b.id);
  });
  turnsUsed = Math.ceil(turnsUsed);

  return { landUsed, turnsUsed };
});

const userInput =  ref<{ [key: string]: number }>({});
buildingTypes.forEach(b => {
  userInput.value[b.id] = 0;
});

const build = () => {
  emit('build', _.clone(userInput.value));
  buildingTypes.forEach(b => {
    userInput.value[b.id] = 0;
  });
};

</script>

<style scoped>
input {
  width: 5rem;
  text-align: right;
  background: #eee;
}

tr:nth-child(odd) {
  background: #333;
}

</style>
