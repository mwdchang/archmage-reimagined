<template>
  <button @click="handleClick" :disabled="showSpinner || disabled" :class="type"> 
    <div class="row">
      <SpinnerIcon v-if="showSpinner === true" class="spinner" />
      <span>{{ label }}</span>
    </div>
  </button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import SpinnerIcon from '@/assets/images/spinner.svg';

const props = defineProps<{ 
  proxyFn: () => Promise<any>,
  label: string,
  disabled?: boolean,
  type?: 'warn' | null 
}>(); 


const showSpinner = ref(false);

const handleClick = async () => {
  const spinnerTimeout = setTimeout(() => {
    showSpinner.value = true;
  }, 80);

  await props.proxyFn();
  clearTimeout(spinnerTimeout);

  if (showSpinner) {
    setTimeout(() => {
      showSpinner.value = false;
    }, 200);
  }
};
</script>

<style scoped>
.warn {
  background: #d80 !important;
}
</style>
