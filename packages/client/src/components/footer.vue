<template>
  <div class="footer" style="margin-top: 10px; gap: 15px">
    <router-link to="/about">Main</router-link>

    <!-- short cuts -->
    <router-link to="/build" v-if="route.name === 'explore'">
      Build
    </router-link>

    <router-link to="/spell" v-if="route.name === 'charge'">
      Cast Magic
    </router-link>

  </div>
  <div style="font-size: 75%">
    Server Time: {{ readableDate(new Date()) }}
  </div>
</template>

<script setup lang="ts">
import { readableDate } from '@/util/util';
import { useRoute } from 'vue-router';

const route = useRoute();

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

