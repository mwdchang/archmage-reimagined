<template>
  <h4> Battle effect </h4>
  <p v-if="effect.filters">
    {{ effect.filters }}
  </p>
  <p>
    Targeting {{ effect.target }} on {{ effect.targetType }} units 
    <span v-if="effect.filters"> with {{ effect.filters }} </span>
  </p>
  <div>&nbsp;</div>
  <template v-for="battleEffect in effect.effects">
    <AttrEffect v-if="battleEffect.effectType === 'UnitAttrEffect'" :effect="battleEffect as any" />
    <HealEffect v-if="battleEffect.effectType === 'UnitHealEffect'" :effect="battleEffect as any" />
    <DamageEffect v-if="battleEffect.effectType === 'UnitDamageEffect'" :effect="battleEffect as any" />
  </template>
</template>

<script lang="ts" setup>
import { BattleEffect } from 'shared/types/effects';
import AttrEffect from '@/components/attr-effect.vue';
import HealEffect from '@/components/heal-effect.vue';
import DamageEffect from '@/components/damage-effect.vue';

defineProps<{
  effect: BattleEffect
}>();

</script>
