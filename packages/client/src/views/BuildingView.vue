<template>
  <h3>Build</h3>
  <build-table @build="build($event)" />
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import BuildTable from '@/components/build-table.vue';

const mageStore = useMageStore();

const build = async (payload: any) => {
  console.log('build', payload);
  const res = await API.post('build', payload);
  mageStore.setMage(res.data.mage as Mage);
};
</script>
