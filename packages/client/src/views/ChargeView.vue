<template>
  <main v-if="mageStore.mage">
    <div class="section-header">Mana Charge</div>
    <section> 
      <p>
        You raw income is {{ readbleNumber(manaIncome(mageStore.mage)) }} mana per turn.
      </p>
      <div class="form">
        <input type="number" placeholder="# turns" size="8" v-model="turnsToCharge">
        <button @click="charge"> Charge </button>
      </div>
      <div>
        {{ manaMsg }}
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { manaIncome } from 'engine/src/magic';
import { readbleNumber } from '@/util/util';

const turnsToCharge = ref(0);
const mageStore = useMageStore();

const exploreMsg = ref('');
const manaMsg = ref('');

const charge = async () => {
  const res = await API.post('/charge', { turns: turnsToCharge.value });
  mageStore.setMage(res.data.mage);
  manaMsg.value = `You used ${turnsToCharge.value} turn and charged ${res.data.manaGained} mana.`
};

onMounted(() => {
  exploreMsg.value = '';
});
</script>

<style scoped>
input {
  text-align: right;
}

main {
  max-width: 30rem;
}
</style>
