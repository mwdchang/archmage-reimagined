<template>
  <section class="display-section">
    <div v-if="effect.trigger" style="margin-bottom: 10px">  
      Rolls {{ effect.trigger.min }} to {{ effect.trigger.max }} times
    </div>

    <table>
      <thead>
        <tr>
          <th>Result</th>
          <th>Weight</th>
          <th>Range</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="roll of effect.rolls">
          <td> {{ roll.target ? roll.target : 'nothing' }} </td>
          <td class="text-right"> {{ roll.weight }} </td>
          <td class="text-right"> {{ readbleNumber(roll.min) }} to {{ readbleNumber(roll.max) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts" setup>
import { WishEffect } from 'shared/types/effects';
import { readbleNumber } from '@/util/util';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: WishEffect
}>();

</script>
