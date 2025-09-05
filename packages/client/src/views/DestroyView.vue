<template>
  <div class="section-header">Destroy Buildings</div>
  <destroy-table @destroy="destroy($event)" />
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import DestroyTable from '@/components/destroy-table.vue';

const mageStore = useMageStore();

const destroy = async (payload: any) => {
  console.log('destroy', payload);
  const res = await API.post('destroy', payload);
  mageStore.setMage(res.data.mage as Mage);
};

</script>
