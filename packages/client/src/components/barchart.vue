<template>
  <div class="w-full h-[20px] bg-black/10 rounded overflow-visible">
    <div
      class="h-full transition-[width] duration-300 ease-out opacity-80"
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



