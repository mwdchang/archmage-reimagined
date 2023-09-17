<template>
  <table v-if="mageStore.mage" class="header-info">
    <tr>
      <td> Turns {{ mageStore.mage.currentTurn }} / {{ mageStore.mage.maxTurn }} </td>
      <td> Land {{ interior.totalLand(mageStore.mage) }} </td>
    </tr>
    <tr>
      <td> Magic {{ mageStore.mage.currentMana }} / {{ interior.manaStorage(mageStore.mage) }} </td>
      <td> Geld {{ mageStore.mage.currentGeld }} </td>
    </tr>
    <tr>
      <td> Enchants </td>
      <td> Population {{ mageStore.mage.currentPopulation }} / {{ interior.maxPopulation(mageStore.mage) }}</td>
    </tr>
  </table>
  <br>
</template>

<script setup lang="ts">
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
const mageStore = useMageStore();
</script>

<style scoped>
.header-info {
  width: 70vw;
}

table > tr > td {
  padding: 1px;
  width: 50%;
}
</style>
