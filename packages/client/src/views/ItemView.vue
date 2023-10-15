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

    <div>Target</div>
    <input type="text" v-model="target" />

    <div># of times</div> 
    <input type="text" v-model="turns" />
    <br>

    <button @click="useItem">Use Item</button>

    <div v-if="itemResult.length">
      <div v-for="(d, idx) of itemResult" :key="idx">
        {{ d.message }}
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
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
const turns = ref<number>(1);
const target = ref<string>('');
const itemResult = ref<any[]>([]);

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


const useItem = async () => {
  const res = (await API.post('item', { 
    itemId: selected.value, 
    num: turns.value, 
    target: target.value 
  })).data;

  if (res.r) {
    itemResult.value = res.r;
  }

  if (res.mage) {
    mageStore.setMage(res.mage);
  }
};

</script>
