<template>
  <div v-if="effect.rule === 'fixed'">
    Create <span class="special-text">value</span> {{ effect.unitId }} 
    <span v-if="effect.target"> from kingdom's {{ effect.target }} </span>
  </div>
  <div v-if="effect.rule === 'spellLevelPercentageBase'">
    Create <span class="special-text">spell power / max spell power * value * base </span>
    {{ effect.unitId }} 
    <span v-if="effect.target"> from kingdom's {{ effect.target }} </span>
  </div>

  <div 
    v-for="(magic) of allowedMagicList"
    style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
    <div class="row" v-if="effect.magic[magic]">
      <magic :magic="magic as string" />
      <span>{{ effect.magic[magic].value }} </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TemporaryUnitEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { readbleNumber, readableStr } from '@/util/util';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: TemporaryUnitEffect 
}>();
</script>



