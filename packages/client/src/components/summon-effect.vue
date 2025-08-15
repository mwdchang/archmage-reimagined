<template>
  <p>
    Summons {{ effect.unitIds.join(', ') }}
  </p>
  <div 
    v-for="(magic) in magics" :key="magic"
    style="display: flex; flex-direction: row; align-items: center">
    <magic :magic="magic" /> &nbsp; 
    <div v-if="effect.rule === 'spellLevel'">
      {{ effect.magic[magic].value * effect.summonNetPower }} net power
    </div>
    <div v-if="effect.rule === 'fixed'">
      {{ effect.magic[magic].value }} units
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UnitSummonEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: UnitSummonEffect
}>();

const magics = ['ascendant', 'verdant', 'eradication', 'nether', 'phantasm'];

</script>



