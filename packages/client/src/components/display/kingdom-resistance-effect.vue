<template>
  <section class="display-section">
    <div v-if="effect.rule === 'spellLevel'">
      Modify {{ effect.resistance}} resistance by <span class="special-text">spell power * value</span>
    </div>

    <div 
      v-for="(magic) of allowedMagicList"
      class="magic-value-row">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" small />
        <span>
          {{ effect.magic[magic].value}}
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { KingdomResistanceEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: KingdomResistanceEffect
}>();

</script>
