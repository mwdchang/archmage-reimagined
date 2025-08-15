<template>
  <template v-for="(key) of Object.keys(effect.attributes)">
    <div> {{ key.split(",").join(",&nbsp;&nbsp;") }} </div>
    <div> {{ effect.attributes[key].rule }} </div>

    <div 
      v-for="(val, magic) of effect.attributes[key].magic"
      style="display: flex; flex-direction: row; align-items: center">
      <magic :magic="magic as string" /> &nbsp; 
      {{ val.value }} 
    </div>

    <div>&nbsp;</div>
  </template>
</template>

<script lang="ts" setup>
import { UnitAttrEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';

defineProps<{
  effect: UnitAttrEffect
}>();

</script>

<style scoped>
</style>
