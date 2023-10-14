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
  // const c2 = '#123456';
  const c2 = '#423434';

  if (m === 'ascendant') {
    return `radial-gradient(#eeeeff, ${c2})`;
  } else if (m === 'verdant') {
    return `radial-gradient(#22FF22, ${c2})`;
  } else if (m === 'eradication') {
    return `radial-gradient(#ff1133, ${c2})`;
  } else if (m === 'nether') {
    return `radial-gradient(#552255, ${c2})`;
  } else {
    return `radial-gradient(#2299ff, ${c2})`;
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
