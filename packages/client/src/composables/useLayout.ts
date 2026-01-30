// useLayout.ts
import { ref, onMounted, onUnmounted } from 'vue'

export type LayoutMode = 'table' | 'cards'

const THRESHOLD = 1024;

export function useLayout() {
  const layout = ref<LayoutMode>('table')

  const updateLayout = () => {
    layout.value = window.innerWidth < THRESHOLD ? 'cards' : 'table'
  }

  onMounted(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateLayout)
  })

  return { layout }
}

