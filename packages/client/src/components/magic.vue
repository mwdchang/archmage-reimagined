<template>
  <div class="rounded-[48%] border border-[#999] p-[2px] m-[2px]" :class="_class" :style="{ 'background-image': color }"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  magic: String,
  small: Boolean,
  tiny: Boolean
});

const color = computed(() => {
  const m = props.magic;

  if (m === 'ascendant') {
    return `radial-gradient(#eeeeff, #888888)`;
  } else if (m === 'verdant') {
    return `radial-gradient(#22FF22, #888888)`;
  } else if (m === 'eradication') {
    return `radial-gradient(#ff1100, #ff9900)`;
  } else if (m === 'nether') {
    return `radial-gradient(#331133, #223322)`;
  } else if (m === 'phantasm') {
    return `radial-gradient(#2299ff, #2255ee)`;
  } else {
    return `radial-gradient(#555, #555)`;
  }
});

const _class = computed(() => {
  if (props.tiny) return 'w-[0.65rem] h-[0.65rem] p-0 m-0';
  if (props.small) return 'w-[0.85rem] h-[0.85rem]';
  return 'w-[1.0rem] h-[1.0rem]';
});

</script>

