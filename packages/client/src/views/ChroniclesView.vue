<template>
  <h3> Previous engagements </h3>
  <div v-for="(d, idx) of chronicles" :key="idx" @click="openReport(d)"> 
    <router-link :to="{ name: 'battleResult', params: { id: d.id }}"> 
      {{ new Date(d.timestamp) }} 
      <br>
      {{ d.summary }}
    </router-link>
    <br>
    <br>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import type { BattleReportSummary } from 'shared/types/battle';

const chronicles = ref<BattleReportSummary[]>([]);

const openReport = (d) => {
};

onMounted(async () => {
  const res = (await API.get(`/mage-battles`)).data;
  chronicles.value = res.battles;
});

</script>
