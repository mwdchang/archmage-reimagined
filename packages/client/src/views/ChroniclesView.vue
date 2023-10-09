<template>
  <h3> Previous engagements </h3>
  <div v-for="(d, idx) of chronicles" :key="idx" @click="openReport(d)"> 
    <router-link :to="{ name: 'battleResult', params: { id: d.id }}"> 
      {{ new Date(d.timestamp) }} 
      <br>
      {{ d.summaryLogs.join(' ') }}
    </router-link>
    <br>
    <br>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';

const chronicles = ref<any[]>([]);

// Note d is id
const openReport = (d) => {

};

onMounted(async () => {
  const res = (await API.get(`/mage-battles`)).data;
  chronicles.value = res.battles;
});

</script>
