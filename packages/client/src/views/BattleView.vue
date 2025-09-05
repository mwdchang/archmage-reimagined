<template>
  <h2>War</h2>

  <section class="form">
    <p> All attack type cost 2 turns </p>
    <input type="text" placeholder="mage id" v-model="targetId" /> 

    <button @click="prepBattle"> War </button>
  </section>

  <div>Counters you given out</div>
  <table>
    <tbody>
      <tr>
        <td> Name </td>
        <td class="text-right"> Damage dealt </td>
        <td class="text-right"> Damage % </td>
        <td class="text-right"> Time </td>
      </tr>
      <tr v-for="(summary, idx) of offensiveBattles" :key="summary.id">
        <td> 
          <div class="row">
            <magic :magic="mages[summary.defenderId]?.magic" small /> 
            {{ summary.defenderName }} (#{{ summary.defenderId }}) 
          </div>
        </td>
        <td class="text-right"> {{ readbleNumber(summary.defenderPowerLoss) }} </td>
        <td class="text-right"> {{ (summary.defenderPowerLossPercentage * 100).toFixed(2) }}% </td>
        <td> {{ readableDate(summary.timestamp) }} </td>
      </tr>
    </tbody>
  </table>
  <br/>

  <div>Counters you received</div>
  <table>
    <tbody>
      <tr>
        <td> Name </td>
        <td class="text-right"> Damage dealt </td>
        <td class="text-right"> Damage % </td>
        <td class="text-right"> Time </td>
      </tr>
      <tr v-for="(summary, idx) of defensiveBattles" :key="summary.id">
        <td> 
          <div class="row">
            <magic :magic="mages[summary.attackerId]?.magic" small /> 
            {{ summary.attackerName }} (#{{ summary.attackerId }}) 
          </div>
        </td>
        <td class="text-right"> {{ readbleNumber(summary.defenderPowerLoss) }} </td>
        <td class="text-right"> {{ (summary.defenderPowerLossPercentage * 100).toFixed(2) }}% </td>
        <td> {{ readableDate(summary.timestamp) }} </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { useRouter, useRoute } from 'vue-router';
import { BattleReportSummary } from 'shared/types/battle';
import { readbleNumber, readableDate } from '@/util/util';
import Magic from '@/components/magic.vue';

const router = useRouter();
const mageStore = useMageStore();
const targetId = ref('');
const involvedBattles = ref<BattleReportSummary[]>([]);
const mages = ref<{[key: number]: any}>({});

const offensiveBattles = computed(() => {
  return involvedBattles.value.filter(d => d.attackerId === mageStore.mage!.id);
});


const defensiveBattles = computed(() => {
  return involvedBattles.value.filter(d => d.defenderId === mageStore.mage!.id);
})

const prepBattle = async () => {
  if (!mageStore.mage) return;
  if (!targetId.value || targetId.value === '') return;

  router.push({
    name: 'battlePrep',
    params: {
      targetId: targetId.value
    }
  });
};

onMounted(async () => {
  const route = useRoute();
  if (route.query.targetId) {
    targetId.value = route.query.targetId as string;
  }

  const result = (await API.get<{ battles: BattleReportSummary[] }>('/mage-battles')).data;
  involvedBattles.value = result.battles;

  const ids = [
    ...result.battles.map(d => d.attackerId),
    ...result.battles.map(d => d.defenderId)
  ];

  const metadata = (await API.post('/mages', { ids })).data;
  mages.value = metadata.mages
});

</script>

<style scoped>
td {
  padding: 0 10px
}
</style>
