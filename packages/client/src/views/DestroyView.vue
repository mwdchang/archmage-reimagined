<template>
  <div class="section-header">Destroy Buildings</div>
  <div class="row">
    <img src="@/assets/images/destroy.png" class="gen-img" />
  </div>
  <p v-if="mageStore">
    You have {{ readbleNumber(mageStore.mage!.wilderness) }} acres of wilderness.
  </p>

  <destroy-table @destroy="destroy($event)" />
  <div v-if="errorStr" class="error">{{ errorStr }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import DestroyTable from '@/components/destroy-table.vue';
import { readbleNumber } from '@/util/util';

const mageStore = useMageStore();
const errorStr = ref('');

const destroy = async (payload: any) => {

  const { data, error } = await APIWrapper(() => {
    return API.post('destroy', payload);
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
