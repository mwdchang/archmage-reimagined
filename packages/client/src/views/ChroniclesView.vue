<template>
  <main>
    <h3> Previous engagements </h3>
    <div v-for="(d, idx) of chronicles" :key="idx" style="margin-bottom: 10px"> 
      <router-link :to="{ name: 'battleResult', params: { id: d.id }}"> 
        <p>
          {{ formatEpochToUTC(d.timestamp) }} 
        </p>
        <p>
          (#{{ d.attackerId }}) army {{ d.attackType }} (#{{ d.defenderId }}) army on the battlefield, 
          (#{{ d.attackerId }}) killed {{ d.summary.defender.unitsLoss }} units and lost {{ d.summary.attacker.unitsLoss }} units.
          The attack was a {{ d.summary.isSuccessful ? 'success' : 'failure' }}
        </p>
      </router-link>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import type { BattleReportSummary } from 'shared/types/battle';

const chronicles = ref<BattleReportSummary[]>([]);

const formatEpochToUTC = (epochMillis: number) => {
  const date = new Date(epochMillis);
  const iso = date.toISOString();
  return iso.replace('T', ' ').slice(0, 19);
}

onMounted(async () => {
  const res = (await API.get<{ battles: BattleReportSummary[]}>(`/mage-battles`)).data;
  chronicles.value = res.battles;
});
</script>
