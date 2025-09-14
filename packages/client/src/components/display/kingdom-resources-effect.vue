<template>
  <div v-if="effect.rule === 'addSpellLevelPercentage'">
    Modify {{ effect.target }} by <span class="special-text">spell power / max spell power * value</span>
  </div>

  <div v-if="effect.rule === 'addSpellLevelPercentageBase'">
    Modify {{ effect.target }} by <span class="special-text">spell power / max spell power * value * base </span>
  </div>

  <div 
    v-for="(magic) of magicTypes"
    style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
    <div class="row" v-if="effect.magic[magic]">
      <magic :magic="magic as string" />
      <span>
        {{ effect.magic[magic].value.min }} to
        {{ effect.magic[magic].value.max }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { KingdomResourcesEffect } from 'shared/types/effects';
import { magicTypes } from 'engine/src/base/references';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: KingdomResourcesEffect 
}>();

</script>
