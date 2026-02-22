<template>
  <main>
    <section class="form">
      <h3 class="section-header">Description</h3>
      <p style="margin-bottom: 0.5rem">Change your mage's description</p>
      <textarea style="margin-bottom: 0.5rem; width: 80%; height: 5rem">
      </textarea>

      <h3 class="section-header">Depart from Terra</h3>
      <div style="margin-bottom: 0.5rem">
        Your mage will be banished. You can only leave if you have no blood on your hands for the last 24 hours.
      </div>
      <div v-if="hasBloodOnHand" class="error">
        You cannot leave Terra with blood on your hands in the last 24 hours.
      </div>
      <div class="row" style="align-items: baseline; gap: 1rem">
        <input type="checkbox" v-model="confirmDelete" style="width:15px; height:15px"> 
        <label>Confirm disband</label>
        <ActionButton 
          :proxy-fn="deleteMage"
          :disabled="confirmDelete === false || hasBloodOnHand === true"
          :label="'Delete'" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ActionButton from './action-button.vue';
import { BattleReportSummary } from 'shared/types/battle';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { useRouter } from 'vue-router';

const confirmDelete = ref(false);
const mageStore = useMageStore();
const router = useRouter();

const mageBattles = ref<BattleReportSummary[]>([]);

const hasBloodOnHand = computed(() => {
  return mageBattles.value.some(d => d.attackerId === mageStore.mage!.id);
});

const deleteMage = async () => {
  if (!mageStore.mage) return;
  const hasBloodOnHand = mageBattles.value.some(d => d.attackerId === mageStore.mage!.id);
  if (hasBloodOnHand) {
    return;
  }

  const res = await API.delete('/mage');
  mageStore.setMage(null);
  router.push({ name: 'home' });
}

onMounted(async () => {
  if (!mageStore.mage) return;
  const result = (await API.get<{ battles: BattleReportSummary[] }>('/mage-battles', {
    params: {
      targetId: mageStore.mage.id,
      window: 24
    }
  })).data;
  mageBattles.value = result.battles;
});

</script>
