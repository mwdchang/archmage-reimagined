<template>
  <div class="magic-glyph" :class="{ 'small': props.small }" :style="{ 'background-image': color }"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  magic: String,
  small: Boolean
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


</script>

<style scoped>
.magic-glyph {
  width: 18px;
  height: 18px;
  border-radius: 48%;
  border: 1px solid #999999;
  padding: 2px;
  margin: 2px;
}

.small {
  width: 12px;
  height: 12px;
}
</style>
