<template>
  <section class="display-section">
    <div v-if="effect.rule === 'spellLevel'" class="row">
      Modify {{ productionStr(effect.production) }} by <span class="special-text">spell power * value</span>
    </div>

    <div v-if="effect.rule === 'addPercentageBase'" class="row">
      Modify {{ productionStr(effect.production) }} by <span class="special-text">value</span> percent
    </div>
    
    <div v-if="effect.rule === 'addSpellLevelPercentageBase'" class="row">
      Modify {{ productionStr(effect.production) }} by <span class="special-text">spell power / max spell power * value * base </span>
    </div>

    <div v-if="effect.rule === 'add'" class="row">
      Modify {{ productionStr(effect.production) }} by <span class="special-text">value</span>
    </div>

    <div 
      v-for="(magic) of allowedMagicList"
      style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" small />
        <span>
          {{ effect.magic[magic].value }} 
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ProductionEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: ProductionEffect 
}>();


const productionStr = (v: string) => {
  if (v === 'land') return 'exploration';
  if (v === 'nodes') return 'mana production';
  if (v === 'farms') return 'food production';
  if (v === 'barrack') return 'recruitment';

  return v;
}

</script>
