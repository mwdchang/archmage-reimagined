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
          <input type="number" size="6" class="w-[5rem] text-right bg-[#eee]" v-model="userInput[bType.id]"> 
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form mt-4">
    <div class="flex flex-row items-baseline gap-[5px]">
      <input type="checkbox" v-model="confirmDestroy" class="w-[15px] h-[15px]"> 
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
tr:nth-child(odd) {
  background: #333;
}
</style>
