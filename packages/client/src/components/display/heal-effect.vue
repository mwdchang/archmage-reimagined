<template>
  <div v-if="effect.healType === 'points' && effect.rule === 'spellLevel'">
    Generate healing points for each stack by <span class="special-text">number of starting units * value * spell level</span>
  </div>

  <div v-if="effect.healType === 'points' && effect.rule === 'none'">
    Generate healing points for each stack by <span class="special-text">number of starting units * value</span>
  </div>

  <div v-if="effect.healType === 'percentage'">
    Heal each stack by <span class="special-text">percentage</span> of fallen units.
  </div>

  <div 
    v-for="(magic) of allowedMagicList"
    class="magic-value-row">
    <div class="row" v-if="effect.magic[magic]">
      <magic :magic="magic as string" small />
      <span>{{ effect.magic[magic].value }} </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UnitHealEffect } from 'shared/src/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: UnitHealEffect
}>();


</script>
