<template>
  <table v-if="mageStore.mage">
    <tbody>
      <tr>
        <td> Name </td>
        <td> Upkeep </td>
        <td> # </td>
      </tr>
      <tr v-for="(u) of unitsStatus" :key="u.id">
        <td> 
          <router-link :to="{ name: 'viewUnit', params: { id: u.id }}"> {{ u.name }} </router-link>
        </td>
        <td class="text-right"> {{ u.upkeep.geld }} / {{ u.upkeep.mana }} / {{ u.upkeep.population }} </td>
        <td class="text-right" style="padding-left: 10px"> {{ u.size }} </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getArmy } from '@/util/util';

const mageStore = useMageStore();

const unitsStatus = computed(() => {
  if (!mageStore.mage) return []
  let rawArmy = getArmy(mageStore.mage);

  return rawArmy.sort((a, b) => b.power - a.power);
});


</script>

<style>
</style>
