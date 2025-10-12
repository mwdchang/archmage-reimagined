<template>
  <div class="bar-container">
    <div
      class="bar-fill"
      :style="{
        width: computedWidth,
        backgroundColor: color,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { defineProps } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    default: '#3498db',
  },
})

const computedWidth = computed(() => `${props.value * 100}%`)
</script>

<style scoped>
.bar-container {
  width: 100%;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.1); /* semi-transparent background */
  border-radius: 4px;
  overflow: visible;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  opacity: 0.8;
}
</style>

