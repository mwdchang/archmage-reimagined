<template>
  <table v-if="mage">
    <tbody>
      <tr>
        <td>&nbsp;</td>
        <td>Building</td>
        <td>Current</td>
        <td>Destroy</td>
      </tr>

      <tr v-for="(bType) of buildingTypes" :key="bType.id">
        <td>-</td>
        <td>{{ readableStr(bType.id) }}</td>
        <td class="text-right">{{ readableNumber(mage[bType.id]) }} </td>
        <td> 
          <input type="number" size="6" v-model="userInput[bType.id]"> 
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form" style="margin-top: 1rem">
    <div class="row" style="align-items: baseline">
      <input type="checkbox" v-model="confirmDestroy" style="width: 15px; height: 15px"> 
      <label>Destroy confirmation</label>
    </div>
    <button @click="destroy" :disabled="confirmDestroy === false"> Destroy </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { buildingTypes } from 'engine/src/interior';
import { readableNumber, readableStr } from '@/util/util';

const emit = defineEmits(['destroy']);
const mageStore = useMageStore();
const mage = computed(() => mageStore.mage);


const confirmDestroy = ref(false);

const userInput =  ref<{ [key: string]: number }>({});
buildingTypes.forEach(b => {
  userInput.value[b.id] = 0;
});

const destroy = () => {
  confirmDestroy.value = false;
  emit('destroy', userInput.value);
};

</script>

<style scoped>
input {
  width: 5rem;
  text-align: right;
  background: #eee;
}

tr:nth-child(odd) {
  background: #333;
}
</style>
