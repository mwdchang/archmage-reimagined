<template>
  <main>
    <div class="section-header">Previous Engagements</div>
    <br>
    <div v-for="(d, idx) of chronicles" :key="idx" style="margin-bottom: 10px"> 
      <div class="row" style="max-width: 35rem; gap: 10px; align-items: flex-start">
        <img 
          v-if="mage.id === d.attackerId && d.isSuccessful === true"
          src="@/assets/images/attack-win.png" 
          class="icon win"
        />
        <img 
          v-if="mage.id === d.attackerId && d.isSuccessful === false"
          src="@/assets/images/attack-loss.png" 
          class="icon loss"
        />
        <img 
          v-if="mage.id === d.defenderId && d.isSuccessful === false"
          src="@/assets/images/defend-win.png" 
          class="icon win"
        />
        <img 
          v-if="mage.id === d.defenderId && d.isSuccessful === true"
          src="@/assets/images/defend-loss.png" 
          class="icon loss"
        />
        <div>
          <div>{{ formatEpochToUTC(d.timestamp) }}</div>
          <router-link :to="{ name: 'battleResult', params: { id: d.id }}"> 
            {{d.attackerName }} (#{{ d.attackerId }}) army {{ d.attackType }} {{ d.defenderName }} (#{{ d.defenderId }}) army on the battlefield, 
            {{d.attackerName }} (#{{ d.attackerId }}) slew {{ d.defenderUnitsLoss }} units and lost {{ d.attackerUnitsLoss }} units.
            The attack {{ d.isSuccessful ? 'succedded' : 'failed' }}
          </router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { API } from '@/api/api';
import type { BattleReportSummary } from 'shared/types/battle';
import { useMageStore } from '@/stores/mage';

const mageStore = useMageStore();

const mage = computed(() => {
  return mageStore.mage!;
});

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

<style scoped>
main {
  max-width: 40rem;
  max-height: 30rem;
  overflow-y: scroll;
}
p { line-height: 125% }

.icon {
  width: 58px;
  border-radius: 12px;
}

.icon.win {
  background: #228833;
}
.icon.loss {
  background: #882233;
}
</style>
