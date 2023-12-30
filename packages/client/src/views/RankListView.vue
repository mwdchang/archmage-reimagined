<template>
  <table v-if="mageStore.mage">
    <tr>
      <td>Ranking</td>
      <td>Name</td>
      <td>&nbsp;</td>
      <td>Land</td>
      <td>Fort</td>
      <td>Power</td>
      <td>Status</td>
      <td>-</td>
    </tr>
    <tr v-for="(rank, idx) of rankList" 
      :class="{active: rank.id === mageStore.mage.id}"
      :key="idx">
      <td> {{ idx + 1 }} </td>
      <td> (#{{ rank.id }}) {{ rank.name }} </td>
      <td> <magic :magic="rank.magic" /> </td>
      <td class="text-right"> {{ rank.land }} </td>
      <td class="text-right"> {{ rank.forts }} </td>
      <td class="text-right"> {{ rank.netPower }} </td>
      <td>NA</td>
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
