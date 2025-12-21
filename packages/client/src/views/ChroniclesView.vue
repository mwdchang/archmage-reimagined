<template>
  <main>
    <div class="section-header">Engagements in last 24 hours</div>
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
        <img 
          v-if="mage.id !== d.defenderId && mage.id !== d.attackerId"
          src="@/assets/images/spy.png" 
          class="icon spy"
        />
        <div>
          <div>{{ formatEpochToUTC(d.timestamp) }}</div>
          <router-link v-if="d.id !== '???'" 
            :to="{ name: 'battleResult', params: { id: d.id }}"> 
            {{d.attackerName }} (#{{ d.attackerId }}) army {{ d.attackType }} {{ d.defenderName }} (#{{ d.defenderId }}) army on the battlefield, 
            {{d.attackerName }} (#{{ d.attackerId }}) slew {{ d.defenderUnitsLoss }} units and lost {{ d.attackerUnitsLoss }} units.
            The attack {{ d.isSuccessful ? 'succeeded' : 'failed' }}
          </router-link>
          <div v-else>
            {{d.attackerName }} (#{{ d.attackerId }}) army {{ d.attackType }} {{ d.defenderName }} (#{{ d.defenderId }}) army on the battlefield, 
          </div>
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
import { useRoute } from 'vue-router';

const mageStore = useMageStore();
const route = useRoute();

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
  let targetId = mage.value.id;
  let window = 24;

  if (route.query.targetId) {
    targetId = +route.query.targetId
  }
  if (route.query.window) {
    window = +route.query.window;
  }

  if (window > 72) {
    window = 72;
  }

  const res = (await API.get<{ battles: BattleReportSummary[]}>(`/mage-battles`, {
    params: {
      targetId,
      window
    }
  })).data;

  chronicles.value = res.battles.filter(d => {
    return ['siege', 'regular', 'pillage'].includes(d.attackType) === true;
  });;
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
.icon.spy {
  background: #888888;
}


</style>
