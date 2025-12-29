<template>
  <section class="display-section">
    <div v-if="effect.rule === 'addSpellLevelPercentage'">
      Modify {{ effect.target }} by <span class="special-text">spell power / max spell power * value</span>
    </div>

    <div v-if="effect.rule === 'addSpellLevelPercentageBase'">
      Modify {{ effect.target }} by <span class="special-text">spell power / max spell power * value * base </span>
    </div>

    <div v-if="effect.rule === 'add'">
      Modify {{ effect.target }} by <span class="special-text">value</span> below
    </div>

    <div 
      v-for="(magic) of allowedMagicList"
      style="align-items: center; margin-left: 1rem; gap: 15px">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" small />
        <span>
          {{ readableNumber(effect.magic[magic].value.min) }} to
          {{ readableNumber(effect.magic[magic].value.max) }}
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { KingdomResourcesEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';
import { readableNumber } from '@/util/util';

defineProps<{
  effect: KingdomResourcesEffect 
}>();

</script>
