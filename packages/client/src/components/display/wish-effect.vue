<template>
  <section class="display-section">
    <div v-if="effect.trigger" class="mb-2.5">  
      Rolls {{ effect.trigger.min }} to {{ effect.trigger.max }} times. The following effects may occur.
    </div>

    <table class="min-w-[25rem]">
      <thead>
        <tr>
          <th class="text-left">Result</th>
          <th class="text-left">% Chance</th>
          <th class="text-left">Range</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="roll of effect.rolls">
          <td> {{ roll.target ? readableStr(roll.target) : 'Nothing' }} </td>
          <td class="text-right"> {{ readableNumber(100 * roll.weight / totalWeight) }} </td>
          <td class="text-right"> {{ readableNumber(roll.min) }} to {{ readableNumber(roll.max) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { WishEffect } from 'shared/src/effects';
import { readableNumber, readableStr } from '@/util/util';
import Magic from '@/components/magic.vue';

const props = defineProps<{
  effect: WishEffect
}>();

const totalWeight = computed(() => {
  return props.effect.rolls.reduce((acc, roll) => {
    return acc + roll.weight;
  }, 0);
});


</script>
