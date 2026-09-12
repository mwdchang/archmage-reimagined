<template>
  <div v-if="mageStore.mage" class="w-full h-[20px] flex justify-center items-center border-t border-[#333] mt-[10px] gap-[15px]">
    <router-link to="/about">Main</router-link>

    <!-- short cuts -->
    <router-link to="/build" v-if="route.name === 'explore'">
      Build
    </router-link>

    <router-link to="/spell" v-if="route.name === 'charge'">
      Cast Magic
    </router-link>
  </div>

  <div class="text-[75%] mt-[5px]">
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

