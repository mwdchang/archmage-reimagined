<template>
  <main class="column" style="align-items: center">
    <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
      <ImageProxy src="/images/ui/battle.png" />
      <div>
        <div class="section-header">War</div>
        <div> 
          All attack type cost 2 turns. 
          <br>- Regular destroys 5% land
          <br>- Siege destroys 10% land
          <br>- Pillage steals geld
          <br>
          Counters last for 24 hours.
        </div>
      </div>
    </div>

    <section class="form" style="width: 25rem">
      <select v-model="battleType">
        <option value="regular">Regular</option>
        <option value="siege">Siege</option>
        <option value="pillage">Pillage</option>
      </select>
      <input type="text" placeholder="mage id" v-model="targetId" /> 

      <ActionButton 
        :proxy-fn="prepBattle"
        :label="'War'" />
    </section>

    <div>Counters you given out</div>
    <table style="min-width: 30rem">
      <tbody>
        <tr>
          <td> Name </td>
          <td> Action </td>
          <td class="text-right"> Damage dealt </td>
          <td class="text-right"> Damage % </td>
          <td class="text-right"> Time </td>
        </tr>
        <tr v-for="(summary, idx) of offensiveBattles" :key="summary.id">
          <td> 
            <div class="row">
              <magic :magic="mages[summary.defenderId]?.magic" small /> 
              <router-link :to="{ name: 'mage', params: { mageId: summary.defenderId }}">
                {{ summary.defenderName }} (#{{ summary.defenderId }}) 
              </router-link>
            </div>
          </td>
          <td>
            <div v-if="['pillage', 'regular', 'siege'].includes(summary.attackType)">
              <router-link :to="{ name: 'battleResult', params: { id: summary.id }}">
                {{ readableStr(summary.attackType) }}
              </router-link>
            </div>
            <div v-else>
              {{ readableStr(summary.attackType) }}
            </div>
          </td>
          <td class="text-right"> {{ readableNumber(summary.defenderPowerLoss) }} </td>
          <td class="text-right"> {{ (summary.defenderPowerLossPercentage * 100).toFixed(2) }}% </td>
          <td> {{ readableDate(summary.timestamp) }} </td>
        </tr>
      </tbody>
    </table>
    <br/>

    <div>Counters you received</div>
    <table style="min-width: 30rem">
      <tbody>
        <tr>
          <td> Name </td>
          <td> Action </td>
          <td class="text-right"> Damage received</td>
          <td class="text-right"> Damage % </td>
          <td class="text-right"> Time </td>
        </tr>
        <tr v-for="(summary, idx) of defensiveBattles" :key="summary.id">
          <td> 
            <div class="row">
              <magic :magic="mages[summary.attackerId]?.magic" small /> 
              <router-link :to="{ name: 'mage', params: { mageId: summary.attackerId }}">
                {{ summary.attackerName }} (#{{ summary.attackerId }}) 
              </router-link>
            </div>
          </td>
          <td>
            <div v-if="['pillage', 'regular', 'siege'].includes(summary.attackType)">
              <router-link :to="{ name: 'battleResult', params: { id: summary.id }}">
                {{ readableStr(summary.attackType) }}
              </router-link>
            </div>
            <div v-else>
              {{ readableStr(summary.attackType) }}
            </div>
          </td>
          <td class="text-right"> {{ readableNumber(summary.defenderPowerLoss) }} </td>
          <td class="text-right"> {{ (summary.defenderPowerLossPercentage * 100).toFixed(2) }}% </td>
          <td> {{ readableDate(summary.timestamp) }} </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { useRouter, useRoute } from 'vue-router';
import { BattleReportSummary } from 'shared/types/battle';
import { readableNumber, readableDate, readableStr } from '@/util/util';
import Magic from '@/components/magic.vue';
import ActionButton from '@/components/action-button.vue';
import ImageProxy from '@/components/ImageProxy.vue';

const router = useRouter();
const mageStore = useMageStore();
const targetId = ref('');
const involvedBattles = ref<BattleReportSummary[]>([]);
const mages = ref<{[key: number]: any}>({});

const battleType = ref('regular');

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
      targetId: targetId.value,
      battleType: battleType.value
    }
  });
};

onMounted(async () => {
  const route = useRoute();
  if (route.query.targetId) {
    targetId.value = route.query.targetId as string;
  }

  const result = (await API.get<{ battles: BattleReportSummary[] }>('/mage-battles', {
    params: {
      targetId: mageStore.mage!.id,
      window: 24
    }
  })).data;
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
