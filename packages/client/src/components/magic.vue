<template>
  <div class="magic-glyph" :class="_class" :style="{ 'background-image': color }"></div>
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
  if (props.tiny) return 'tiny';
  if (props.small) return 'small';
  return 'regular';
});

</script>

<style scoped>
.magic-glyph {
  border-radius: 48%;
  border: 1px solid #999999;
  padding: 2px;
  margin: 2px;
}

.regular {
  width: 1.0rem;
  height: 1.0rem;
}

.small {
  width: 0.85rem;
  height: 0.85rem;
}

.tiny {
  width: 0.65rem;
  height: 0.65rem;
  padding: 0px;
  margin: 0px;
}


</style>
