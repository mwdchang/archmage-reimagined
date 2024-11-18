<template>
  <main v-if="mageStore.mage">
    <h2> Gelding </h2>
    <section> 
      <p>
        In times of war and empty treasuries the people have to fullfil their obligations. 
        Your income is about {{ geldIncome(mageStore.mage) }} geld
      </p>
      <input type="number" placeholder="# turns" size="10" v-model="turnsToGeld">
      <button @click="geld"> Geld </button>
      <div>
        {{ geldMsg }}
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { geldIncome } from 'engine/src/interior';

const turnsToGeld = ref(0);
const mageStore = useMageStore();

const exploreMsg = ref('');
const geldMsg = ref('');

const geld = async () => {
  const res = await API.post('/geld', { turns: turnsToGeld.value });
  mageStore.setMage(res.data.mage);
  geldMsg.value = `You used ${turnsToGeld.value} turn and gelded ${res.data.geldGained} geld.`
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
