<template>
  <h2>War</h2>
  <p> All attack type cost 2 turns </p>
  <input type="text" placeholder="mage id" v-model="targetId" /> 
  <br>
  <button @click="prepBattle"> War </button>
  <br>

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
        <td> {{ summary.defenderName }} (#{{ summary.defenderId }}) </td>
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
        <td> {{ summary.attackerName }} (#{{ summary.attackerId }}) </td>
        <td class="text-right"> {{ readbleNumber(summary.defenderPowerLoss) }} </td>
        <td class="text-right"> {{ (summary.defenderPowerLossPercentage * 100).toFixed(2) }}% </td>
        <td> {{ readableDate(summary.timestamp) }} </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { ref, computed, onMounted } from 'vue';
import { useMageStore } from '@/stores/mage';
import { useRouter, useRoute } from 'vue-router';
import { BattleReportSummary } from 'shared/types/battle';
import { readbleNumber, readableDate } from '@/util/util';

const router = useRouter();
const mageStore = useMageStore();
const targetId = ref('');
const involvedBattles = ref<BattleReportSummary[]>([]);

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
  console.log('!!');
  console.log(involvedBattles);
});

</script>

<style scoped>
td {
  padding: 0 10px
}
</style>
