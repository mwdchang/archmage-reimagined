<template>
  <main v-if="mageStore.mage">
    <div class="section-header">Gelding</div>
    <div class="row" style="margin-bottom: 10px">
      <img src="@/assets/images/geld.png" class="gen-img" />
    </div>
    <section> 
      <p>
        In times of war and empty treasuries the people have to fullfil their obligations. 
        Your income is about {{ readableNumber(geldIncome(mageStore.mage)) }} geld per turn.
      </p>
      <section class="form" style="width: 25rem">
        <input type="number" placeholder="# turns" size="10" v-model="turnsToGeld">
        <ActionButton 
          :proxy-fn="geld"
          :label="'Geld'" />

      </section>
      <div>
        {{ geldMsg }}
      </div>
      <div v-if="errorStr" class="error">{{ errorStr }}</div>
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

<style scoped>
input {
  text-align: right;
}

main {
  max-width: 30rem;
}
</style>
