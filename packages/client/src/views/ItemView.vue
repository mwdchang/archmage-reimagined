<template>
  <div class="section-header">Your item inventory</div>
  <p>
    You have {{ itemList.length }} item types in your inventory storage.
  </p>
  <div class="row">
    <img src="@/assets/images/item.png" class="gen-img" />
  </div>

  <section class="row" style="align-items: flex-start; gap: 0.5rem; margin-top: 10px">
    <div style="max-height: 400px; overflow-y: scroll; padding: 0">
      <table v-if="itemList.length > 0" style="min-width: 15rem">
        <thead style="position: sticky; top: 0; z-index: 10">
          <tr>
            <th>Name</th>
            <!--<th>Attributes</th>-->
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, _idx) of usableItems" :key="item.id">
            <td>
              <router-link :to="{ name: 'viewItem', params: { id: item.id }}"> {{ item.name }} </router-link>
            </td>
            <!--<td>{{ item.attributes.join(', ') }}</td>-->
            <td class="text-right">{{ item.amount }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="width: 250px">
        You do not have any items in your inventory.
      </div>
    </div>
    <div> 
      <section class="form" style="max-width: 20rem">
        <div class="form-tabs">
          <div class="tab" :class="{ active: tabView === 'instant' }" @click="changeView('instant')">Instant</div>
          <div class="tab" :class="{ active: tabView === 'battle' }" @click="changeView('battle')">Battle</div>
          <div class="tab" :class="{ active: tabView === 'special' }" @click="changeView('special')">Special</div>
        </div>

        <div v-if="tabView === 'instant'">
          <label>Use item</label>
          <select v-model="selected" v-if="usableItems.length > 0">
            <option v-for="item of usableItems" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>

          <label>Target</label>
          <input type="text" v-model="target" />

          <label># of times</label>
          <input type="number" v-model="turns" />

          <ActionButton 
            :disabled="selected === ''"
            :proxy-fn="useItem"
            :label="'Use Item'" />
        </div>
        <div v-if="tabView === 'battle'">
          <p>
            You can configure your defensive battle items under
            <router-link :to="{ name: 'assignment' }">
              Assignment
            </router-link>
          </p>
        </div>
        <div v-if="tabView === 'special'">
          <p> Special and passive items</p>
        </div>
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
import ActionButton from '@/components/action-button.vue';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMageStore } from '@/stores/mage';
import { getItems } from '@/util/util';

const selected = ref('');
const turns = ref<number>(1);
const target = ref<string>('');
const itemResult = ref<any[]>([]);

const tabView = ref('instant');

const changeView = (v: string) => {
  tabView.value = v;
  selected.value = '';
};

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const itemList = computed(() => {
  if (!mage.value) return [];

  let result = getItems(mage.value);
  return result.sort((a, b) => a.id.localeCompare(b.id));
});

const usableItems = computed(() => {
  return itemList.value.filter(item => {
    const attrs = item.attributes;

    if (tabView.value === 'battle') {
      return attrs.includes('oneUse') && attrs.includes('battle');
    } else if (tabView.value === 'instant') {
      return attrs.includes('oneUse') && attrs.includes('instant');
    } else {
      return attrs.includes('unique'); 
    }
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
