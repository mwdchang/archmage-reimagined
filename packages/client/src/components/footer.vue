<template>
  <div class="footer" style="margin-top: 10px; gap: 15px" v-if="mageStore.mage">
    <router-link to="/about">Main</router-link>

    <!-- short cuts -->
    <router-link to="/build" v-if="route.name === 'explore'">
      Build
    </router-link>

    <router-link to="/spell" v-if="route.name === 'charge'">
      Cast Magic
    </router-link>
  </div>

  <div style="font-size: 75%; margin-top: 5px">
    Server Time: {{ readableDate(new Date()) }}.
    Commit <a :href="link" target="_blank">{{commitHash}}</a>
  </div>
</template>

<script setup lang="ts">
import { readableDate } from '@/util/util';
import { useRoute } from 'vue-router';
import { useMageStore } from '@/stores/mage';

const route = useRoute();
const mageStore = useMageStore();

// @ts-ignore
const commitHash = import.meta.env.VITE_GIT_COMMIT_HASH;
const link = `https://github.com/mwdchang/archmage-reimagined/commit/${commitHash}`;
</script>


<style scoped>
.footer {
  width: 100%;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid #333;
}
</style>

