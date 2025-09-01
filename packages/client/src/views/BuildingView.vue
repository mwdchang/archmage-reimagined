<template>
  <h3 class="section-header">Build</h3>
  <p v-if="mageStore">
    You have {{ readbleNumber(mageStore.mage!.wilderness) }} acres of wilderness.
  </p>
  <build-table @build="build($event)" />
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import BuildTable from '@/components/build-table.vue';
import { readbleNumber } from '@/util/util';

const mageStore = useMageStore();

const build = async (payload: any) => {
  const res = await API.post('build', payload);
  mageStore.setMage(res.data.mage as Mage);
};
</script>
