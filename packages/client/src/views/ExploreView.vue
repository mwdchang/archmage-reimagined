<template>
  <main v-if="mageStore.mage">
    <h2> Explore </h2>
    <section> 
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
import { explorationRate } from 'engine/src/interior';
import type { Mage } from 'shared/types/mage';

const turnsToExplore = ref(0);
const mageStore = useMageStore();

const exploreRate = computed(() => {
  return (explorationRate(mageStore.mage as Mage)).toFixed(0); 
});

const exploreMsg = ref('');

const exploreLand = async () => {
  const res = await API.post('/explore', { turns: turnsToExplore.value });
  mageStore.setMage(res.data.mage);
  exploreMsg.value = `You used ${turnsToExplore.value} and found ${res.data.landGained} wilderness.`
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
