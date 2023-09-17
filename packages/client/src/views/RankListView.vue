<template>
  <table>
    <tr v-for="(rank, idx) of rankList" :key="idx">
      <td> (#{{ rank.id }}) {{ rank.name }} </td>
      <td> <magic :magic="rank.magic" /> </td>
      <td> {{ rank.land }} </td>
      <td> {{ rank.netPower }} </td>
      <td> 
        <router-link :to="{ name: 'mage', params: { mageId: rank.id }}"> view </router-link>
      </td>
    </tr>
  </table>


</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API } from '@/api/api';
import Magic from '@/components/magic.vue';

const rankList = ref<any[]>([]);

onMounted(async () => {
  rankList.value = (await API.get('ranklist')).data.rankList;
});

</script>
