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
        <td>{{ bType.id }}</td>
        <td class="text-right">{{ mage[bType.id] }} </td>
        <td> <input type="number" size="6" v-model="userInput[bType.id]"> </td>
      </tr>
    </tbody>
  </table>
  <button @click="destroy"> Destroy </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { buildingTypes } from 'engine/src/interior';

const emit = defineEmits(['destroy']);
const mageStore = useMageStore();
const mage = computed(() => mageStore.mage);

const userInput =  ref<{ [key: string]: number }>({});
buildingTypes.forEach(b => {
  userInput.value[b.id] = 0;
});

const destroy = () => {
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
