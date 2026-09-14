<template>
  <section class="display-section">
    <div v-if="effect.rule === 'landPercentageLoss'">
      Destroys a percentage of {{effect.target}} buildings by 
      <span class="special-text"> spell power / max spell power * value </span>
    </div>

    <div 
      v-for="(magic) of allowedMagicList"
      class="magic-value-row">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" small />
        <span>
          {{ effect.magic[magic].value.min }} to
          {{ effect.magic[magic].value.max }}
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { KingdomBuildingsEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: KingdomBuildingsEffect 
}>();

</script>
