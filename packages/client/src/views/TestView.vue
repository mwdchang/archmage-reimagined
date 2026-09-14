<template>
  <h2>Test page</h2>
  <div class="flex flex-col">
    <div class="row"><magic magic="ascendant" /> Ascendant </div>
    <div class="row"><magic magic="verdant" /> Verdant </div>
    <div class="row"><magic magic="eradication" /> Eradication </div>
    <div class="row"><magic magic="nether" /> Nether </div>
    <div class="row"><magic magic="phantasm" /> Phantasm </div>
  </div>
</template>

<script setup lang="ts">
import Magic from '@/components/magic.vue';
</script>
