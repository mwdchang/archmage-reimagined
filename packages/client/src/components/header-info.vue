<template>
  <div class="row">
  </div>
  <table v-if="mageStore.mage" class="header-info">
    <tbody>
      <tr>
        <td> 
          <div class="row"> 
            <svg-icon :name="'hourglass'" :size="16" />
            <div>{{ readbleNumber(mage.currentTurn) }} </div>
          </div>
        </td>
        <td> 
          <div class="row"> 
            <svg-icon :name="'land'" :size="16" />
            <div>{{ readbleNumber(totalLand(mage)) }}</div>
          </div>
        </td>
        <td> 
          <div class="row"> 
            <svg-icon :name="'mana'" :size="16" />
            <div>{{ readbleNumber(mage.currentMana) }} </div>
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
            <svg-icon :name="'population'" :size="16" />
            <div>{{ readbleNumber(mage.currentPopulation) }} </div>
          </div>
        </td>
        <td> 
          <div class="row" style="gap: 2px">
            <magic v-for="(enchant, idx) of mage.enchantments" :Key="idx" :magic="enchant.spellMagic" small />
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
import { readbleNumber } from '@/util/util';
import { Mage } from 'shared/types/mage';

const mageStore = useMageStore();
const mage = computed<Mage>(() => {
  return mageStore.mage!;
});
</script>

<style scoped>
.header-info {
  width: 55vw;
  font-size: 80%;
}

table > tbody > tr > td {
  padding: 0px;
  padding-left: 2px;
  line-height: 1.25rem;
  width: 20%;
}
</style>
