<template>
  <section class="display-section">
    <div v-if="effect.trigger" style="margin-bottom: 10px">  
      Rolls {{ effect.trigger.min }} to {{ effect.trigger.max }} times, <span class="special-text">weight</span> indicates the proportional likelihood of the result happening.
    </div>

    <table style="min-width: 25rem">
      <thead>
        <tr>
          <th class="text-left">Result</th>
          <th class="text-left">Weight</th>
          <th class="text-left">Range</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="roll of effect.rolls">
          <td> {{ roll.target ? readableStr(roll.target) : 'Nothing' }} </td>
          <td class="text-right"> {{ roll.weight }} </td>
          <td class="text-right"> {{ readableNumber(roll.min) }} to {{ readableNumber(roll.max) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts" setup>
import { WishEffect } from 'shared/types/effects';
import { readableNumber, readableStr } from '@/util/util';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: WishEffect
}>();

</script>
