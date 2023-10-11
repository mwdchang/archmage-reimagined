<template>
  <main v-if="mageStore.mage">
    <h2> Interior </h2>
    <section> 
      Taxation
      <p>
        In times of war and empty treasuries the people have to fullfil their obligations. 
        Your income is about {{ geldIncome(mageStore.mage) }} geld
      </p>
      <input type="number" placeholder="# turns" size="10" v-model="turnsToTax">
      <button @click="geld"> Tax </button>
      <div>
        {{ geldMsg }}
      </div>
    </section>
    <br>
    <section> 
      Explore
      <p>
        You get an average of {{ exploreRate }} acres of land per turn. 
        The amount of land explored per turn decreases as your land increases.
      </p>
      <input type="number" placeholder="# turns" size="10" v-model="turnsToExplore">
      <button @click="exploreLand"> Explore </button>
      <div>
        {{ exploreMsg }}
      </div>
    </section> 
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { explorationRate, geldIncome } from 'engine/src/interior';

const turnsToExplore = ref(0);
const turnsToTax = ref(0);
const mageStore = useMageStore();

const exploreRate = computed(() => {
  return (explorationRate(mageStore.mage)).toFixed(0); 
});

const exploreMsg = ref('');
const geldMsg = ref('');

const exploreLand = async () => {
  const res = await API.post('/explore', { turns: turnsToExplore.value });
  mageStore.setMage(res.data.mage);
  exploreMsg.value = `You used ${turnsToExplore.value} and found ${res.data.landGained} wilderness.`
};

const geld = async () => {
  const res = await API.post('/geld', { turns: turnsToTax.value });
  mageStore.setMage(res.data.mage);
  geldMsg.value = `You used ${turnsToTax.value} turn and taxed ${res.data.geldGained} geld.`
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
