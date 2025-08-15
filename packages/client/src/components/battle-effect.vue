<template>
  <p v-if="effect.filters">
    {{ effect.filters }}
  </p>
  <template v-for="battleEffect in (effect as BattleEffect).effects">
    <AttrEffect v-if="battleEffect.effectType === 'UnitAttrEffect'" :effect="battleEffect as any" />
  </template>
</template>

<script lang="ts" setup>
import { BattleEffect } from 'shared/types/effects';
import AttrEffect from '@/components/attr-effect.vue';

defineProps<{
  effect: BattleEffect
}>();

</script>
