<template>
  <span
    v-html="iconSvg"
    :style="{ width: sizePx, height: sizePx, display: 'inline-block' }"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
})

const sizePx = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size
)

const iconMap = {
  fort: `
    <svg viewBox="0 0 24 24" fill="none" stroke="#bbbbbb" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      
      <rect x="4"  y="2" width="16" height="4" rx="1" ry="1" fill="none"/>
      <rect x="2"  y="8" width="20" height="12" rx="1" ry="1" fill="none"/>
    </svg>
  `,
  hourglass: `
    <svg viewBox="0 0 24 24" fill="none" stroke="#bbbbbb" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2h12M6 22h12M6 2c0 6 6 6 6 10s-6 4-6 10M18 2c0 6-6 6-6 10s6 4 6 10"/>
    </svg>
  `,
  land: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
      fill="none" stroke="#bbbbbb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Top diamond -->
      <polygon points="12,1 21,9 12,17 3,9" />
      <!-- Bottom diamond -->
      <polygon points="12,7 21,15 12,23 3,15" />
    </svg>
  `,
  mana: `
    <svg viewBox="0 0 24 24" fill="none" stroke="#bbbbbb" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 6 10 6 14a6 6 0 0 0 12 0c0-4-6-12-6-12z"/>
    </svg>
  `,
  population: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
      fill="none" stroke="#bbbbbb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">

      <circle cx="12" cy="6" r="4" />
      <path d="M3 20c0-3.5 3-6 9-6s6 2.5 9 6" />


    </svg>
  `,
  geld: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbbbbb" stroke-width="1.0" xmlns="http://www.w3.org/2000/svg">
      <rect x="4"  y="12" width="10" height="2" rx="1" ry="1" fill="none"/>
      <rect x="4"  y="10" width="10" height="2" rx="1" ry="1" fill="none"/>
      <rect x="6"  y="8" width="10" height="2" rx="1" ry="1" fill="none"/>
      <rect x="3"  y="6" width="10" height="2" rx="1" ry="1" fill="none"/>
      <rect x="6"  y="4"  width="10" height="2" rx="1" ry="1" fill="none"/>
      <rect x="8"  y="2"  width="11" height="2" rx="1" ry="1" fill="none"/>
    </svg>
  `,
}

const iconSvg = computed(() => iconMap[props.name] || '')
</script>
