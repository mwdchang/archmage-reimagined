<template>
  <main>
    <div class="view-header-row">
      <ImageProxy src="/images/ui/build.png" />
      <div>
        <div class="section-header">Build</div>
        <div>
          You have {{ readableNumber(mageStore.mage!.wilderness) }} acres of wilderness.
        </div>
      </div>
    </div>
    <build-table @build="build($event)" />
    <div v-if="buildStr">{{ buildStr }}</div>
    <div v-if="errorStr" class="error p-1 mt-2">{{ errorStr }}</div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { Mage } from 'shared/src/mage';
import BuildTable from '@/components/build-table.vue';
import { readableNumber, readableStr } from '@/util/util';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();
const errorStr = ref('');
const buildStr = ref('');

const build = async (payload: { [key: string]: number }) => {
  const { data, error } = await APIWrapper(() => {
    buildStr.value = '';
    errorStr.value = '';
    return API.post('build', payload);
  });

  if (error) {
    errorStr.value = error;
    return;
  }

  if (data) {
    mageStore.setMage(data.mage as Mage);

    // Construct message
    const summary = Object.entries(payload)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${readableNumber(v)} ${readableStr(k)}`);
    buildStr.value = `You built ${summary.join(', ')}`;
  }
};
</script>
