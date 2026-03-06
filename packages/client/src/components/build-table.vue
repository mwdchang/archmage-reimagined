<template>
  <table v-if="mage">
    <tbody>
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
        <td> {{ readableStr(bType.id) }} </td>
        <td class="text-right"> {{ readableNumber(mage[bType.id]) }} </td>
        <td class="text-right"> {{ (100 * mage[bType.id] / land).toFixed(2) }} </td>
        <td class="text-right"> {{ bType.geldCost }} / {{ bType.manaCost }} </td>
        <td class="text-right"> {{ buildingRate(mage, bType.id).toFixed(2) }} </td>
        <td> 
          <input type="number" v-model="userInput[bType.id]" style="height: 1.6rem" @keyup.enter="build">
        </td>
      </tr>
    </tbody>
  </table>
  <section class="form" style="margin-top: 1.0rem">
    <div style="margin-bottom: 0.25rem"> Land required {{ summary.landUsed }}, Turns required {{ summary.turnsUsed }} </div>
    <button @click="build" :disabled="buildingDisabled"> Build </button>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { buildingTypes, buildingRate } from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';
import { readableNumber, readableStr } from '@/util/util';

const mageStore = useMageStore();
const emit = defineEmits(['build']);
const mage = computed(() => mageStore.mage!);

const land = computed(() => totalLand(mage.value!));
const summary = computed(() => {
  let landUsed = 0;
  let turnsUsed = 0;

  buildingTypes.forEach(b => {
    landUsed += userInput.value[b.id];
    turnsUsed += userInput.value[b.id] /  buildingRate(mage.value!, b.id);
  });
  turnsUsed = Math.ceil(turnsUsed);

  return { landUsed, turnsUsed };
});

const buildingDisabled = computed(() => {
  return summary.value.landUsed > mage.value.wilderness || 
    summary.value.turnsUsed > mage.value.currentTurn;
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
