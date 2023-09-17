<template>
  <main>
    <h2> Interior </h2>
    <section> 
      Taxation
      <br>
      <input type="number" placeholder="# turns" size="10" v-model="turnsToTax">
      <button> Tax </button>
    </section>
    <section> 
      Explore
      <br>
      <input type="number" placeholder="# turns" size="10" v-model="turnsToExplore">
      <button @click="exploreLand"> Explore </button>
    </section> 
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';

const turnsToExplore = ref(0);
const turnsToTax = ref(0);
const mageStore = useMageStore();

const exploreLand = async () => {
  const res = await API.post('/explore', { turns: turnsToExplore.value });
  mageStore.setMage(res.data.mage);
  console.log(res);
};

</script>


<style scoped>
input {
  text-align: right;
}
</style>
