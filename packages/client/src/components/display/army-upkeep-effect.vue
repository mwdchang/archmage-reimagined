<template>
  <section class="display-section">
    <div> Targets </div>
    <div v-if="effect.filters"> 
      <div v-for="(filter) of effect.filters">
        &#10148; <u-filter :filter="filter" />
      </div>
    </div>

    <div class="row" v-if="effect.rule === 'addSpellLevelPercentageBase'">
      Modify upkeep by <span class="special-text"> spell power / max spell power * value * base </span>
    </div>

    <div class="row" v-if="effect.rule === 'addPercentageBase'">
      Modify upkeep by <span class="special-text"> value </span> percent
    </div>

    <div 
      v-for="(magic) of allowedMagicList"
      style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" />
        <span>
          Geld={{ effect.magic[magic].value.geld}},
          Mana={{ effect.magic[magic].value.mana}},
          Population={{ effect.magic[magic].value.population}}
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ArmyUpkeepEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import UFilter from '@/components/display/ufilter.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: ArmyUpkeepEffect
}>();

</script>
