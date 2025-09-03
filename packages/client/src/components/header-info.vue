<template>
  <table v-if="mageStore.mage" class="header-info">
    <tbody>
      <tr>
        <td> 
          <div class="row" style="justify-content:space-between; padding: 0 5px">
            <div>Turns</div>
            <div>{{ readbleNumber(mage.currentTurn) }} / {{ readbleNumber(mage.maxTurn) }} </div>
          </div>
        </td>
        <td> 
          <div class="row" style="justify-content:space-between; padding: 0 5px">
            <div>Land</div> 
            <div>{{ readbleNumber(totalLand(mage)) }}</div>
          </div>
        </td>
        <td> 
          <div class="row" style="justify-content:space-between; padding: 0 5px">
            <div>Mana</div>
            <div>{{ readbleNumber(mage.currentMana) }} / {{ readbleNumber(manaStorage(mage)) }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td> 
          <div class="row" style="justify-content:space-between; padding: 0 5px">
            <div>Geld</div>
            <div>{{ readbleNumber(mage.currentGeld) }} </div>
          </div>
        </td>
        <td> 
          <div class="row" style="justify-content:space-between; padding: 0 5px">
            <div>Pop.</div>
            <div>{{ readbleNumber(mage.currentPopulation) }} / {{ readbleNumber(interior.maxPopulation(mage)) }}</div>
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
  <br>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
import magic from './magic.vue';
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
