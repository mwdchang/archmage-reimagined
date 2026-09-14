<template>
  <main class="border border-[#888] p-[1px]" :style="computedStyle">
    <div @click="isCollapsed = !isCollapsed">close</div>
    <div class="m-[1px]"> 
      <div v-if="!isCollapsed"> Item A </div>
      <div v-if="isCollapsed"> A </div>
    </div>
    <div class="m-[1px]"> 
      <div v-if="!isCollapsed"> Item B </div>
      <div v-if="isCollapsed"> B </div>
    </div>
    <div class="m-[1px]"> 
      <div v-if="!isCollapsed"> Item C </div>
      <div v-if="isCollapsed"> C </div>
    </div>
    <div class="m-[1px]"> 
      <div v-if="!isCollapsed"> Item D </div>
      <div v-if="isCollapsed"> D </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const isCollapsed = ref(true);
const computedStyle = computed(() => {
  return isCollapsed.value === true? { width: '2rem' } : { width: '22rem' };
});

</script>

