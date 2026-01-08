<template>
  <main v-if="mageStore.mage">
    <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
      <ImageProxy src="/images/ui/explore.png" />
      <div>
        <div class="section-header">Explore</div>
        <div>
          You get an average of {{ exploreRate }} acres of land per turn. 
          The amount of land explored per turn decreases as your land increases.
        </div>
      </div>
    </div>
    <section> 
      <div class="form">
        <input type="number" placeholder="# turns" size="10" v-model="turnsToExplore">

        <ActionButton 
          :proxy-fn="exploreLand"
          :label="'Explore'" />

      </div>
      <div>
        {{ exploreMsg }}
      </div>
      <div class="error" v-if="errorStr">
        {{ errorStr }}
      </div>
    </section> 
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { explorationRate } from 'engine/src/interior';
import ActionButton from '@/components/action-button.vue';
import type { Mage } from 'shared/types/mage';
import ImageProxy from '@/components/ImageProxy.vue';

const turnsToExplore = ref(0);
const mageStore = useMageStore();

const exploreRate = computed(() => {
  return (explorationRate(mageStore.mage as Mage)).toFixed(0); 
});

const exploreMsg = ref('');
const errorStr = ref('');

const exploreLand = async () => {
  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    exploreMsg.value = '';
    return API.post('/explore', { turns: turnsToExplore.value });
  })
  
  if (error) {
    errorStr.value = error;
    return;
  }

  if (data) {
    mageStore.setMage(data.mage);
    exploreMsg.value = `You used ${turnsToExplore.value} and found ${data.landGained} wilderness.`
  }
};

onMounted(() => {
  exploreMsg.value = '';
});

</script>


<style scoped>
input {
  text-align: right;
}

main {
  max-width: 30rem;
  display: flex;
  flex-direction: column
}
</style>
