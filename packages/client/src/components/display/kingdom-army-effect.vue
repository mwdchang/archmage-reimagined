<template>
  <section class="display-section">
    <div v-if="effect.rule === 'addSpellLevelPercentageBase'">
      Modifies army  by
      <span class="special-text"> spell power / max spell power * base * value </span>
    </div>

    <div 
      v-for="(magic) of allowedMagicList"
      style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" />
        <span>
          {{ effect.magic[magic].value.min }} to
          {{ effect.magic[magic].value.max }}
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { KingdomArmyEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: KingdomArmyEffect
}>();

</script>
