<template>
  <section class="display-section">
    <div v-if="effect.rule === 'spellLevel'">
      Modify by {{ effect.resistance}} by <span class="special-text">spell power * value</span>
    </div>

    <div 
      v-for="(magic) of magicTypes"
      style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
      <div class="row" v-if="effect.magic[magic]">
        <magic :magic="magic as string" />
        <span>
          {{ effect.magic[magic].value}}
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { KingdomResistanceEffect } from 'shared/types/effects';
import { magicTypes } from 'engine/src/base/references';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: KingdomResistanceEffect
}>();

</script>
