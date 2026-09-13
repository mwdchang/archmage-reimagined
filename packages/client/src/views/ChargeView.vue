<template>
  <main v-if="mageStore.mage" class="max-w-[30rem]">
    <div class="flex flex-row items-center gap-[5px] w-[35rem] max-w-full mb-2">
      <ImageProxy src="/images/ui/charge.png" />
      <div>
        <div class="section-header">Mana Charge</div>
        You currently have {{ readableNumber(mageStore.mage.currentMana) }} mana, with max storage of 
        {{ readableNumber(maxMana(mageStore.mage)) }}. You raw mana income 
        is {{ readableNumber(manaIncome(mageStore.mage)) }} per turn.
      </div>
    </div>
    <section> 
      <div class="form">
        <input type="number" placeholder="# turns" size="8" v-model="turnsToCharge" @keyup.enter="charge" class="text-right">
        <ActionButton 
          :proxy-fn="charge"
          :label="'Charge'" />
      </div>
      <div>
        {{ manaMsg }}
      </div>
      <div v-if="errorStr" class="text-[#e41] bg-[#200]">{{ errorStr }}</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { manaIncome, maxMana } from 'engine/src/magic';
import { readableNumber } from '@/util/util';
import ActionButton from '@/components/action-button.vue';
import ImageProxy from '@/components/ImageProxy.vue';
// import chargeImage from '@/assets/images/ui/charge.png';

const turnsToCharge = ref(0);
const mageStore = useMageStore();

const manaMsg = ref('');
const errorStr = ref('');

const charge = async () => {
  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post('/charge', { turns: turnsToCharge.value });
  });

  if (error) {
    errorStr.value = error;
  }

  if (data) {
    mageStore.setMage(data.mage);
    manaMsg.value = `You used ${turnsToCharge.value} turn and charged ${readableNumber(data.manaGained)} mana.`
  }
};

</script>
