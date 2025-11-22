<template>
  <div class="section-header">Rankings</div>
  <section class="form" style="width: 25rem; margin-bottom: 10px; padding-bottom: 0">
    <div class="row" style="align-items: baseline; gap: 10px">
      <input type="checkbox" v-model="hideRange" style="width: 15px; height: 15px"> 
      <label>Hide mages not in attack range</label>
    </div>
  </section>
  <table v-if="mageStore.mage">
    <tbody>
      <tr>
        <td>Rank</td>
        <td>Name</td>
        <td>&nbsp;</td>
        <td>Land</td>
        <td>Fort</td>
        <td>Power</td>
        <td>Status</td>
      </tr>
      <tr v-for="(rank) of rankListFiltered" 
        :class="{active: rank.id === mageStore.mage.id}"
        :key="rank.id">
        <td class="text-right"> 
          {{ rank.rank }}
        </td>
        <td> 
          <router-link :to="{ name: 'mage', params: { mageId: rank.id }}"> 
            {{ rank.name }} (#{{ rank.id }})
          </router-link>
        </td>
        <td> <magic :magic="rank.magic" small /> </td>
        <td class="text-right"> {{ readableNumber(rank.land) }} </td>
        <td class="text-right"> {{ rank.forts }} </td>
        <td class="text-right"> {{ readableNumber(rank.netPower) }} </td>
        <td>{{ rank.status }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import Magic from '@/components/magic.vue';
import type { MageRank } from 'shared/types/common';
import { readableNumber } from '@/util/util';
import { gameTable } from 'engine/src/base/config';

const rankList = ref<MageRank[]>([]);
const mageStore = useMageStore();
const hideRange = ref(false);

const rankListFiltered = computed(() => {
  if (hideRange.value === true) {
    const mageRank = rankList.value.find(d => d.id === mageStore.mage!.id)
    if (!mageRank) return rankList.value;

    return rankList.value.filter(rank => {
      return mageRank.netPower * gameTable.war.range.max >= rank.netPower &&
        mageRank.netPower * gameTable.war.range.min <= rank.netPower;
    });
  }
  return rankList.value;
});

onMounted(async () => {
  rankList.value = (await API.get('ranklist')).data.rankList;
});

</script>

<style scoped>
table > tr > td {
  min-width: 2rem;
}

.active {
  background: #335
}
</style>
