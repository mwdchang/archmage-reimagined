<template>
  <main v-if="mageStore.mage">
    <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
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
        <input type="number" placeholder="# turns" size="8" v-model="turnsToCharge" @keyup.enter="charge">
        <ActionButton 
          :proxy-fn="charge"
          :label="'Charge'" />
      </div>
      <div>
        {{ manaMsg }}
      </div>
      <div v-if="errorStr" class="error">{{ errorStr }}</div>
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

<style scoped>
input {
  text-align: right;
}

main {
  max-width: 30rem;
}
</style>
