<template>
  <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
    <ImageProxy src="/images/ui/building.png" />
    <div>
      <div class="section-header">Build</div>
      <div>
        - Towns/Farms: Population and unit space
        <br>- Barracks: Recruitment rate
        <br>- Nodes: Mana production and capacity
        <br>- Guilds: Research and item generation
        <br>- Forts: Defence bonus
        <br>- Barriers: Spell resistance
      </div>
    </div>
  </div>
  <p v-if="mageStore">
    You have {{ readableNumber(mageStore.mage!.wilderness) }} acres of wilderness.
  </p>
  <build-table @build="build($event)" />
  <div v-if="errorStr" class="error">{{ errorStr }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import BuildTable from '@/components/build-table.vue';
import { readableNumber } from '@/util/util';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();
const errorStr = ref('');

const build = async (payload: any) => {

  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post('build', payload);
  });

  if (error) {
    errorStr.value = error;
    return;
  }

  if (data) {
    mageStore.setMage(data.mage as Mage);
  }
};
</script>
