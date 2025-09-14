<template>
  <section class="display-section">
    <p v-if="effect.trigger">
      Activates {{ effect.trigger.min }} to {{ effect.trigger.max }} times.
    </p>
    <p> 
      Target {{ effect.targetType }} {{ effect.target}} units <span v-if="effect.filters"> with </span>
      <div v-if="effect.filters"> 
        <div v-for="(filter) of effect.filters">
          &#10148; <u-filter :filter="filter" />
        </div>
      </div>
    </p>
    <div>&nbsp;</div>
    <div v-for="battleEffect in effect.effects" style="margin-bottom: 10px">
      <UnitAttrEffect v-if="battleEffect.effectType === 'UnitAttrEffect'" :effect="battleEffect as any" />
      <HealEffect v-if="battleEffect.effectType === 'UnitHealEffect'" :effect="battleEffect as any" />
      <DamageEffect v-if="battleEffect.effectType === 'UnitDamageEffect'" :effect="battleEffect as any" />
      <TemporaryUnitEffect v-if="battleEffect.effectType === 'TemporaryUnitEffect'" :effect="battleEffect as any" />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { BattleEffect } from 'shared/types/effects';
import UnitAttrEffect from '@/components/display/unit-attr-effect.vue';
import HealEffect from '@/components/display/heal-effect.vue';
import DamageEffect from '@/components/display/damage-effect.vue';
import TemporaryUnitEffect from '@/components/display/temporary-unit-effect.vue';
import UFilter from '@/components/display/ufilter.vue';

defineProps<{
  effect: BattleEffect
}>();

</script>
