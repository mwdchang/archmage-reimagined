<template>
  <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
    <ImageProxy src="/images/ui/destroy.png" />
    <div>
      <div class="section-header">Destroy Buildings</div>
      <div>
        You can demolish and reclaim your buildings as wilderness acres. 
        Demolitions takes one turn.
        <br><br>
        You have {{ readableNumber(mageStore.mage!.wilderness) }} acres of wilderness.
      </div>
    </div>
  </div>
  <destroy-table @destroy="destroy($event)" />
  <div v-if="destroyStr">{{ destroyStr }}</div>
  <div v-if="errorStr" class="error">{{ errorStr }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/types/mage';
import DestroyTable from '@/components/destroy-table.vue';
import { readableNumber, readableStr } from '@/util/util';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();
const errorStr = ref('');
const destroyStr = ref('');

const destroy = async (payload: {[key: string]: number}) => {

  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    destroyStr.value = '';
    return API.post('destroy', payload);
  });

  if (error) {
    errorStr.value = error;
    return;
  }
  
  if (data) {
    const summary = Object.entries(payload)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${readableNumber(v)} ${readableStr(k)}`);
    destroyStr.value = `You destroyed ${summary.join(', ')} and reclaimed them as wilderness`;

    mageStore.setMage(data.mage as Mage);
  }
};
</script>
