<template>
  <div styl;e="line-height: 120%" v-if="effect.rule === 'direct'">
    Deal <span class="f600">{{ effect.damageType.map(readableStr).join(", ") }}</span> damage
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevel'">
    Deal <span class="f600">{{ effect.damageType.map(readableStr).join(", ") }}</span> damage by <span class="special-text">spell level * value</span>
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevelUnitLoss'">
    Destroys units by <span class="special-text">spell level * value</span>
  </div>
  <div style="line-height: 120%" v-if="effect.rule === 'spellLevelUnitDamage'">
    Deal <span class="f600">{{ effect.damageType.map(readableStr).join(", ") }}</span> damage by <span class="special-text">spell level * value * stack size</span>
  </div>

  <div 
    v-for="(magic) of allowedMagicList"
    style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
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
import { UnitDamageEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';
import { readableStr, readableNumber } from '@/util/util';

defineProps<{
  effect: UnitDamageEffect
}>();

</script>
