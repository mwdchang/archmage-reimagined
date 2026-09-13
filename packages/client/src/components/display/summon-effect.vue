<template>
  <section class="display-section">
    <p>
      Summons <span v-if="effect.summonType === 'random'"> one of </span>:
      {{ effect.unitIds.map(readableStr).join(', ') }}
    </p>
    <div v-for="(magic) in allowedMagicList" :key="magic">
      <div v-if="effect.magic[magic]"
        class="magic-value-row">
        <magic :magic="magic" small />
        <div v-if="effect.rule === 'spellLevel'">
          {{ readableNumber(effect.magic[magic].value * effect.summonNetPower) }} net power worth of units, adjusted for spell power
        </div>
        <div v-if="effect.rule === 'fixed'">
          {{ readableNumber(effect.magic[magic].value * effect.summonNetPower) }} net power worth of units
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UnitSummonEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';
import { readableNumber, readableStr } from '@/util/util';
import { allowedMagicList } from 'shared/src/common';

defineProps<{
  effect: UnitSummonEffect
}>();
</script>



