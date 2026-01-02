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
    <svg viewBox="0 0 24 24" fill="none" stroke="#bbbbbb" stroke-width="1.0" xmlns="http://www.w3.org/2000/svg">
      <rect x="3"  y="19" width="15" height="3" rx="1" ry="1" fill="none"/>
      <rect x="3"  y="16" width="15" height="3" rx="1" ry="1" fill="none"/>
      <rect x="5"  y="13" width="15" height="3" rx="1" ry="1" fill="none"/>
      <rect x="2"  y="10" width="15" height="3" rx="1" ry="1" fill="none"/>
      <rect x="5"  y="7"  width="15" height="3" rx="1" ry="1" fill="none"/>
      <rect x="7"  y="4"  width="16" height="3" rx="1" ry="1" fill="none"/>
    </svg>
  `,
  caretUp: `
    <svg viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M6 14l6-6 6 6" />
    </svg>
  `,
  caretDown: `
    <svg viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M6 10l6 6 6-6" />
    </svg>

  `,
  doubleCaretUp: `
    <svg viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M6 16l6-6 6 6" />
      <path d="M6 10l6-6 6 6" />
    </svg>
  `,
  doubleCaretDown: `
    <svg viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M6 8l6 6 6-6" />
      <path d="M6 14l6 6 6-6" />
    </svg>
  `,
  remove: `
    <svg viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="8" x2="16" y2="16" />
      <line x1="16" y1="8" x2="8" y2="16" />
    </svg>
  `,
  message: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
      fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
      <polygon points="1.75 21.25,1.75 9.75,14.25 9.75,14.25 18.25,5.75 18.25"/>
    </svg>
  `
}

const iconSvg = computed(() => iconMap[props.name] || '')
</script>
