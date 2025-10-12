<template>
  <div class="row">
  </div>
  <table v-if="mageStore.mage" class="header-info">
    <tbody>
      <tr>
        <td> 
          <div class="row"> 
            <svg-icon :name="'land'" :size="16" />
            <div>{{ readbleNumber(totalLand(mage)) }}</div>
          </div>
        </td>
        <td> 
          <div class="row"> 
            <svg-icon :name="'geld'" :size="16" />
            <div>{{ readbleNumber(mage.currentGeld) }} </div>
          </div>
        </td>
        <td> 
          <div class="row"> 
            <svg-icon :name="'hourglass'" :size="16" />
            <div>{{ readbleNumber(mage.currentTurn) }} </div>
          </div>
          <Barchart :value="turnVal" color="#8F8" style="height: 2px" />
        </td>

        <td> 
          <div class="row"> 
            <svg-icon :name="'mana'" :size="16" />
            <div>{{ readbleNumber(mage.currentMana) }} </div>
          </div>
          <Barchart :value="manaVal" color="#88F" style="height: 2px" />
        </td>
        <td> 
          <div class="row"> 
            <svg-icon :name="'population'" :size="16" />
            <div>{{ readbleNumber(mage.currentPopulation) }} </div>
          </div>
          <Barchart :value="populationVal" color="#F88" style="height: 2px" />
        </td>
        <td> 
          <div class="row" style="gap: 2px">
            <magic v-for="(enchant, idx) of mage.enchantments" :Key="idx" :magic="enchantMagic(enchant)" small />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { totalLand } from 'engine/src/base/mage';
import magic from './magic.vue';
import SvgIcon from './svg-icon.vue';
import Barchart from './barchart.vue';
import { readbleNumber, enchantMagic } from '@/util/util';
import { Mage } from 'shared/types/mage';
import { maxMana } from 'engine/src/magic';
import { maxPopulation } from 'engine/src/interior';

const mageStore = useMageStore();
const mage = computed<Mage>(() => {
  return mageStore.mage!;
});


const turnVal = computed(() => {
  return (mage.value.currentTurn / mage.value.maxTurn);
});

const manaVal = computed(() => {
  return mage.value.currentMana / maxMana(mage.value);
});

const populationVal = computed(() => {
  return mage.value.currentPopulation / maxPopulation(mage.value);
});


</script>

<style scoped>
.header-info {
  width: 55vw;
  font-size: 80%;
  margin-bottom: 10px;
}

table > tbody > tr > td {
  padding: 0px;
  padding-left: 2px;
  line-height: 1.25rem;
  width: 20%;
  border: 1px solid #333333;
}
</style>
