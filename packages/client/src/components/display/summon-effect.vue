<template>
  <section class="display-section">
    <p>
      Summons <span v-if="effect.summonType === 'random'"> one of </span>:
      {{ effect.unitIds.map(readableStr).join(', ') }}
    </p>
    <div v-for="(magic) in magicTypes" :key="magic">
      <div v-if="effect.magic[magic]"
        style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
        <magic :magic="magic" />
        <div v-if="effect.rule === 'spellLevel'">
          {{ readbleNumber(effect.magic[magic].value * effect.summonNetPower) }} net power worth of units
        </div>
        <div v-if="effect.rule === 'fixed'">
          {{ effect.magic[magic].value }} units
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UnitSummonEffect } from 'shared/types/effects';
import { magicTypes } from 'engine/src/base/references';
import Magic from '@/components/magic.vue';
import { readbleNumber, readableStr } from '@/util/util';

defineProps<{
  effect: UnitSummonEffect
}>();
</script>



