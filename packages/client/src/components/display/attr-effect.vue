<template>
  <template v-for="(attr) of attributes">
    <div style="line-height: 120%">
      Modify {{ attr.key.split(",").join(",&nbsp;") }} by:&nbsp;
      <span style="font-style: italic; color: #fb0; background-color: #333; padding: 3px; border-radius: 2px;">
        <span v-if="attr.rule === 'add'"> value </span>
        <span v-if="attr.rule === 'addPercentageBase'"> value * base </span>
        <span v-if="attr.rule === 'addSpellLevel'"> spell power * value</span>
        <span v-if="attr.rule === 'addSpellLevelPercentage'"> spell power / max spell power * value </span>
        <span v-if="attr.rule === 'addSpellLevelPercentageBase'"> spell power / max spell power * value * attr</span>
      </span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 2px">
      <div 
        v-for="(val, magic) of attr.magic"
        style="display: flex; flex-direction: row; align-items: center; margin-left: 1rem; gap: 15px">
        <magic :magic="magic as string" />
        <span>
          {{ val.value }} 
        </span>
      </div>
    </div>
    <div style="width:100%; border-bottom: 1px solid #888">&nbsp;</div>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { AllowedMagic, UnitAttrEffect } from 'shared/types/effects';
import Magic from '@/components/magic.vue';

const props = defineProps<{
  effect: UnitAttrEffect
}>();

const attributes = computed(() => {
  const keys = Object.keys(props.effect.attributes) as AllowedMagic[];

  return keys.map(key => {
    return {
      key: key,
      rule:  props.effect.attributes[key].rule,
      magic: props.effect.attributes[key].magic
    };
  });
});

</script>

<style scoped>
</style>
