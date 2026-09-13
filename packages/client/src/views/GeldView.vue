<template>
  <main v-if="mageStore.mage" class="max-w-[30rem]">
    <div class="flex flex-row items-center gap-[5px] w-[35rem] max-w-full mb-2">
      <ImageProxy src="/images/ui/geld.png" />
      <div>
        <div class="section-header">Gelding</div>
        In times of war and empty treasuries the people have to fullfil their obligations. 
        Your income is about {{ readableNumber(geldIncome(mageStore.mage)) }} geld per turn.
      </div>
    </div>
    <section> 
      <section class="form w-[25rem]">
        <input type="number" placeholder="# turns" size="10" v-model="turnsToGeld" @keyup.enter="geld" class="text-right">
        <ActionButton 
          :proxy-fn="geld"
          :label="'Geld'" />

      </section>
      <div>
        {{ geldMsg }}
      </div>
      <div v-if="errorStr" class="text-[#e41] bg-[#200]">{{ errorStr }}</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { geldIncome } from 'engine/src/interior';
import { readableNumber } from '@/util/util';
import ActionButton from '@/components/action-button.vue';
import ImageProxy from '@/components/ImageProxy.vue';

const turnsToGeld = ref(0);
const mageStore = useMageStore();

const geldMsg = ref('');
const errorStr = ref('');


const geld = async () => {
  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post('/geld', { turns: turnsToGeld.value });
  });

  if (error) {
    errorStr.value = error;
  }

  if (data) {
    mageStore.setMage(data.mage);
    geldMsg.value = `You used ${turnsToGeld.value} turn and gelded ${data.geldGained} geld.`
  }
};
</script>
