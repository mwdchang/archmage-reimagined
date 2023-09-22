<template>
  <table v-if="mageStore.mage">
    <tr v-for="(rank, idx) of rankList" 
      :class="{active: rank.id === mageStore.mage.id}"
      :key="idx">
      <td> {{ idx + 1 }} </td>
      <td> (#{{ rank.id }}) {{ rank.name }} </td>
      <td> <magic :magic="rank.magic" /> </td>
      <td> {{ rank.land }} </td>
      <td> {{ rank.fortresses }} </td>
      <td> {{ rank.netPower }} </td>
      <td> 
        <router-link :to="{ name: 'mage', params: { mageId: rank.id }}"> view </router-link>
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import Magic from '@/components/magic.vue';

const rankList = ref<any[]>([]);
const mageStore = useMageStore();

onMounted(async () => {
  rankList.value = (await API.get('ranklist')).data.rankList;
});

</script>

<style scoped>
table > tr > td {
  min-width: 2rem;
}
</style>
