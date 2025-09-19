<template>
  <div v-if="effect.healType === 'points'">
    Generate healing points for each stack by number of units * value <span v-if="effect.rule === 'spellLevel'"> * spell level </span>
  </div>
  <div v-if="effect.healType === 'percentage'">Heal each stack by value percentage</div>

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
import { UnitHealEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: UnitHealEffect
}>();


</script>
