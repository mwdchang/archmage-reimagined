<template>
  <div style="line-height: 120%" v-if="effect.rule === 'direct'">
    Deal {{ effect.damageType.join(", ") }} damage
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevel'">
    Deal {{ effect.damageType.join(", ") }} damage by spell level
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevelUnitLoss'">
    Destroys targeted units
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevelUnitDamage'">
    Deal {{ effect.damageType.join(", ") }} damage by spell level * value * stack size
  </div>

  <div 
    v-for="(magic) of magicTypes"
    style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
    <magic :magic="magic as string" />
    <span>{{ effect.magic[magic].value }} </span>
  </div>
</template>

<script lang="ts" setup>
import { UnitDamageEffect } from 'shared/types/effects';
import { magicTypes } from 'engine/src/base/references';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: UnitDamageEffect
}>();

</script>
