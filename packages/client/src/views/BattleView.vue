<template>
  <h2>War</h2>
  <p> All attack type cost 2 turns </p>
  <input type="text" placeholder="mage id" v-model="targetId" /> 
  <br>
  <button @click="prepBattle"> War </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { useRouter } from 'vue-router';

const router = useRouter();
const mageStore = useMageStore();
const targetId = ref('');

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

</script>
