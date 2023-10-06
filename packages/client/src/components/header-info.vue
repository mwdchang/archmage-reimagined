<template>
  <table v-if="mageStore.mage" class="header-info">
    <tr>
      <td> Turns {{ mageStore.mage.currentTurn }} / {{ mageStore.mage.maxTurn }} </td>
      <td> Land {{ totalLand(mageStore.mage) }} </td>
      <td> Mana {{ mageStore.mage.currentMana }} / {{ manaStorage(mageStore.mage) }} </td>
      <td> Geld {{ mageStore.mage.currentGeld }} </td>
      <td> Pop. {{ mageStore.mage.currentPopulation }} / {{ interior.maxPopulation(mageStore.mage) }}</td>
    </tr>
    <tr>
      <td colspan="5"> Enchants </td>
    </tr>
  </table>
  <br>
</template>

<script setup lang="ts">
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
const mageStore = useMageStore();
</script>

<style scoped>
.header-info {
  width: 75vw;
  font-size: 80%;
}

table > tr > td {
  padding: 0px;
  padding-left: 2px;
  line-height: 1.25rem;
  width: 20%;
}
</style>
