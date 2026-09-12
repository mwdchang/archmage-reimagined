<template>
  <table v-if="mageStore.mage" class="w-[35rem] max-w-full text-[0.8rem] mb-[10px]">
    <tbody>
      <tr>
        <td class="p-0 pl-[2px] leading-5 w-[20%] border border-[#333333]"> 
          <div class="flex flex-row items-center gap-[5px]"> 
            <svg-icon :name="'land'" size="1rem" />
            <div>{{ readableNumber(totalLand(mage)) }}</div>
          </div>
        </td>
        <td class="p-0 pl-[2px] leading-5 w-[20%] border border-[#333333]"> 
          <div class="flex flex-row items-center gap-[5px]"> 
            <svg-icon :name="'geld'" size="1rem" />
            <div>{{ readableNumber(mage.currentGeld) }} </div>
          </div>
        </td>
        <td class="p-0 pl-[2px] leading-5 w-[20%] border border-[#333333]"> 
          <div class="flex flex-row items-center gap-[5px]"> 
            <svg-icon :name="'hourglass'" size="1rem" />
            <div>{{ readableNumber(mage.currentTurn) }} </div>
          </div>
          <Barchart :value="turnVal" color="#8F8" class="h-[2px]" />
        </td>

        <td class="p-0 pl-[2px] leading-5 w-[20%] border border-[#333333]"> 
          <div class="flex flex-row items-center gap-[5px]"> 
            <svg-icon :name="'mana'" size="1rem" />
            <div>{{ readableNumber(mage.currentMana) }} </div>
          </div>
          <Barchart :value="manaVal" color="#88F" class="h-[2px]" />
        </td>
        <td class="p-0 pl-[2px] leading-5 w-[20%] border border-[#333333]"> 
          <div class="flex flex-row items-center gap-[5px]"> 
            <svg-icon :name="'population'" size="1rem" />
            <div>{{ readableNumber(mage.currentPopulation) }} </div>
          </div>
          <Barchart :value="populationVal" color="#F88" class="h-[2px]" />
        </td>
        <td class="p-0 pl-[2px] leading-5 w-[20%] border border-[#333333]"> 
          <div class="flex flex-row items-center gap-[1px]">
            <magic v-for="(enchant) of mage.enchantments" 
              :key="enchant.id" 
              :magic="enchantMagic(enchant)" 
              :title="readableStr(enchant.spellId)"
              tiny />
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
import { readableNumber, readableStr, enchantMagic } from '@/util/util';
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
