<template>
  <h2>War</h2>
  <p> All attack type cost 2 turns </p>
  <input type="text" placeholder="mage id" v-model="targetId" /> 
  <br>
  <button @click="doBattle"> War </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';

const mageStore = useMageStore();
const targetId = ref('');

const doBattle = async () => {
  if (!mageStore.mage) return;
  if (!targetId.value || targetId.value === '') return;

  const stackIds = mageStore.mage.army.map(d => d.id);

  console.log('!!', targetId.value);

  const res = await API.post('/war', { 
    targetId: targetId.value,
    spellId: '',
    itemId: '',
    stackIds
  });
};

</script>
