<template>
  <div class="section-header">Your item inventory</div>
  <p>
    You have {{ itemList.length }} spells in your spell book.
  </p>

  <section class="row" style="align-items: flex-start; gap: 20px; margin-top: 10px">
    <div style="max-height: 400px; overflow-y: scroll; padding: 0">
      <table v-if="itemList.length > 0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Attributes</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, _idx) of itemList" :key="item.id">
            <td>
              <router-link :to="{ name: 'viewItem', params: { id: item.id }}"> {{ item.name }} </router-link>
            </td>
            <td>{{ item.attributes.join(', ') }}</td>
            <td class="text-right">{{ item.amount }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="width: 250px">
        You do not have any items in your inventory.
      </div>
    </div>
    <div> 
      <section class="form">
        <label>Use item</label>
        <select v-model="selected" v-if="usableItems.length > 0">
          <option v-for="item of usableItems" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>

        <label>Target</label>
        <input type="text" v-model="target" />

        <label># of times</label>
        <input type="text" v-model="turns" />

        <button @click="useItem">Use Item</button>
      </section>

      <div v-if="itemResult.length">
        <div v-for="(d, idx) of itemResult" :key="idx">
          {{ d.message }}
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMageStore } from '@/stores/mage';
import { getItems } from '@/util/util';

const selected = ref('');
const turns = ref<number>(1);
const target = ref<string>('');
const itemResult = ref<any[]>([]);

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const itemList = computed(() => {
  if (!mage.value) return [];

  let result = getItems(mage.value);
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

<style scoped>
tr:nth-child(odd) {
  background: #222222;
}

td {
  padding-top: 1px;
  padding-bottom: 1px;
}

</style>
