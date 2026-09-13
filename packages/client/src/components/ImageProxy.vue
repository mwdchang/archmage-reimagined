<template>
  <img
    class="h-60 max-[600px]:w-[80vw]"
    :src="currentSrc"
    @error="handleError"
    v-bind="$attrs"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import placeholder from '@/assets/images/placeholder.png';

const props = defineProps({
  src: {
    type: String,
    required: true
  }
})

const currentSrc = ref(props.src)

watch(
  () => props.src,
  (newSrc) => {
    currentSrc.value = newSrc;
  }
)

const handleError = () => {
  currentSrc.value = placeholder;
}
</script>

