<template>
  <h3 class="section-header">Build</h3>
  <div class="row">
    <img src="@/assets/images/building.png" class="gen-img" />
  </div>
  <p v-if="mageStore">
    You have {{ readbleNumber(mageStore.mage!.wilderness) }} acres of wilderness.
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
import { readbleNumber } from '@/util/util';

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
