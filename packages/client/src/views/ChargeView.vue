<template>
  <main v-if="mageStore.mage">
    <div class="section-header">Mana Charge</div>
    <div class="row" style="margin-bottom: 10px">
      <img src="@/assets/images/charge.png" class="gen-img" />
    </div>
    <section> 
      <p>
        You raw income is {{ readableNumber(manaIncome(mageStore.mage)) }} mana per turn.
      </p>
      <div class="form">
        <input type="number" placeholder="# turns" size="8" v-model="turnsToCharge">
        <button @click="charge"> Charge </button>
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
import { manaIncome } from 'engine/src/magic';
import { readableNumber } from '@/util/util';

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
    manaMsg.value = `You used ${turnsToCharge.value} turn and charged ${data.manaGained} mana.`
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
