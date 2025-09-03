<template>
  <p v-if="effect.trigger">
    Activates {{ effect.trigger.min }} to {{ effect.trigger.max }} times.
  </p>
  <p> 
    Targeting {{ effect.target }} on {{ effect.targetType }} units <span v-if="effect.filters"> with </span>
    <div v-if="effect.filters"> 
      <div v-for="(filter) of effect.filters">
        &#10148; <u-filter :filter="filter" />
      </div>
    </div>
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
import AttrEffect from '@/components/display/attr-effect.vue';
import HealEffect from '@/components/display/heal-effect.vue';
import DamageEffect from '@/components/display/damage-effect.vue';
import UFilter from '@/components/display/ufilter.vue';

defineProps<{
  effect: BattleEffect
}>();

</script>
