<template>
  <h3> Previous engagements </h3>
  <div v-for="(d, idx) of chronicles" :key="idx" @click="openReport(d)"> 
    <router-link :to="{ name: 'battleResult', params: { id: d.id }}"> 
      {{ new Date(d.timestamp) }} 
      <br>
      <!--
      {{ d }}
      <br>
      -->
      (#{{ d.attackerId }}) army {{ d.attackType }} (#{{ d.defenderId }}) army on the battlefield, 
      (#{{ d.attackerId }}) killed {{ d.summary.defender.unitsLoss }} units and lost {{ d.summary.attacker.unitsLoss }} units.
      The attack was a {{ d.summary.isSuccessful ? 'success' : 'failure' }}
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
