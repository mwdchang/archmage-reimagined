<template>
  <div class="footer">
    <router-link to="/about">Main</router-link>
  </div>
  <div style="font-size: 75%">
    Server Time: {{ readableDate(new Date()) }}
  </div>
</template>

<script setup lang="ts">
import { readableDate } from '@/util/util';
</script>


<style scoped>
.footer {
  width: 100%;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

