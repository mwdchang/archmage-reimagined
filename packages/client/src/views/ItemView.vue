<template>
  <div class="section-header">Your item inventory</div>
  <br>

  <section>
    <table>
      <tr v-for="(item, _idx) of itemList" :key="item.id">
        <td>{{ item.name }}</td>
        <td>{{ item.attributes.join(', ') }}</td>
        <td>{{ item.amount }}</td>
      </tr>
    </table>

    <br>

    <select v-model="selected">
      <option v-for="item of usableItems" :key="item.id" :value="item.id">{{ item.name }}</option>
    </select>
    <button @click="useItem">Use Item</button>

  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMageStore } from '@/stores/mage';
import { getItemById } from 'engine/src/base/references';

interface MageItem {
  id: string,
  name: string,
  attributes: string[],
  amount: number
}


const selected = ref('');
const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const itemList = computed(() => {
  if (!mage.value) return [];

  let result: MageItem[] = [];
  Object.keys(mage.value.items).forEach(key => {
    const item = getItemById(key);
    result.push({
      id: key,
      name: item.name,
      attributes: item.attributes,
      amount: mage.value?.items[key] as number
    });
  });
  return result;
});

const usableItems = computed(() => {
  return itemList.value.filter(item => {
    const attrs = item.attributes;
    return attrs.includes('oneUse') && !attrs.includes('battle');
  });
});


const useItem = () => {
};

</script>
