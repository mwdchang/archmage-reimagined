<template>
  <div class="effect-desc" v-if="effect.target !== 'unit'">
    Deal  <span class="f600">{{ effect.damageType.map(readableStr).join(", ") }}</span> {{ targetStr }}, {{ ruleStr }}
  </div>
  <div class="effect-desc" v-else>
    Destroy units directly, {{ ruleStr }}
  </div>

  <div 
    v-for="(magic) of allowedMagicList"
    class="magic-value-row">
    <div class="row" v-if="effect.magic[magic]">
      <magic :magic="magic as string" small />
      <span v-if="typeof effect.magic[magic].value === 'object'">
        {{ readableNumber(effect.magic[magic].value.min) }} to
        {{ readableNumber(effect.magic[magic].value.max) }} 
      </span>
      <span v-else>
        {{ readableNumber(effect.magic[magic].value) }} 
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UnitDamageEffect, UnitDamageEffectRules } from 'shared/src/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';
import { readableStr, readableNumber } from '@/util/util';
import { computed } from 'vue';

const props = defineProps<{
  effect: UnitDamageEffect
}>();


const ruleStr = computed(() => {
  let label = '';
  if (props.effect.rule === UnitDamageEffectRules.set) {
    label = 'fixed';
  } else {
    label = 'scaled by spell level';
  }
  return label;
});

const targetStr = computed(() => {
  let t = props.effect.target;
  if (t === 'damage') {
    return 'damage';
  } else if (t === 'perUnitDamage') {
    return 'damage per unit';
  } 
  return ''
});


</script>
