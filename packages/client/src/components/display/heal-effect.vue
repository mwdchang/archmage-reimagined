<template>
  <!--
  <div v-if="effect.healType === 'points' && effect.rule === 'spellLevel'">
    Generate healing points for each stack by <span class="special-text">number of starting units * value * spell level</span>
  </div>

  <div v-if="effect.healType === 'points'">
    Generate healing points for each stack by <span class="special-text">number of starting units * value</span>
  </div>

  <div v-if="effect.healType === 'percentage'">
    Heal each stack by <span class="special-text">percentage</span> of fallen units.
  </div>
  -->


  <div v-if="effect.healType === 'points'">
    Generate healing points by <span class="special-text">number of starting units * value</span> in the stack, {{ ruleStr }}
  </div>
  <div v-if="effect.healType === 'percentage'">
    Heal <span class="special-text">value%</span> of fallen units, {{ ruleStr }}
  </div>
  <div v-if="effect.healType === 'units'">
    Heal <span class="special-text">value</span> of fallen units, {{ ruleStr }}
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
import { UnitHealEffect, UnitHealEffectRules } from 'shared/src/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';
import { computed } from 'vue';

const props = defineProps<{
  effect: UnitHealEffect
}>();

const ruleStr = computed(() => {
  let label = '';
  if (props.effect.rule === UnitHealEffectRules.set) {
    label = 'fixed';
  } else {
    label = 'scaled by spell level';
  }
  return label;
});



</script>
