<template>
  <div style="line-height: 120%" v-if="effect.rule === 'direct'">
    Deal {{ effect.damageType.join(", ") }} damage
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevel'">
    Deal {{ effect.damageType.join(", ") }} damage by <span class="special-text">spell level * value</span>
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevelUnitLoss'">
    Destroys units by <span class="special-text">spell level * value</span>
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevelUnitDamage'">
    Deal {{ effect.damageType.join(", ") }} damage by <span class="special-text">spell level * value * stack size</span>
  </div>

  <div 
    v-for="(magic) of magicTypes"
    style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
    <div class="row" v-if="effect.magic[magic]">
      <magic :magic="magic as string" />
      <span>{{ effect.magic[magic].value }} </span>
    </div>
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
