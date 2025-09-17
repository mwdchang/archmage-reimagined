<template>
  <div class="section-header">Destroy Buildings</div>
  <div class="row">
    <img src="@/assets/images/destroy.png" width="400" class="gen-img" />
  </div>
  <p v-if="mageStore">
    You have {{ readbleNumber(mageStore.mage!.wilderness) }} acres of wilderness.
  </p>

  <destroy-table @destroy="destroy($event)" />
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import DestroyTable from '@/components/destroy-table.vue';
import { readbleNumber } from '@/util/util';

const mageStore = useMageStore();

const destroy = async (payload: any) => {
  console.log('destroy', payload);
  const res = await API.post('destroy', payload);
  mageStore.setMage(res.data.mage as Mage);
};

</script>
