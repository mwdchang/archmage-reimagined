<template>
  <main>
    <div class="flex flex-row items-center gap-[5px] w-[35rem] max-w-full mb-2">
      <ImageProxy src="/images/ui/item.png" />
      <div>
        <div class="section-header">Item inventory</div>
        <div>
          You have {{ numItems }} items in your inventory storage.
          <br>
          <br>
          You can sell your surplus items in 
          <router-link :to="{ name: 'market', params: { type: 'sell' }}"> Peddler's Lane </router-link>
        </div>
      </div>
    </div>

    <section class="flex flex-row items-start gap-2 mt-[10px]">
      <div class="max-h-[400px] overflow-y-scroll p-0">
        <table v-if="itemList.length > 0 && layout === 'table'" class="min-w-[15rem]">
          <thead class="sticky top-0 z-10">
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
        <div v-if="itemList.length > 0 && layout === 'cards'" class="min-w-[10rem]">
          <div v-for="(item, _idx) of usableItems" :key="item.id" class="rounded border border-[#333] bg-[#181818] m-2 p-2">
            <router-link :to="{ name: 'viewItem', params: { id: item.id }}"> {{ item.name }} </router-link>
            <div class="grid grid-cols-[1fr_2fr] gap-x-4">
              <div>Amount</div>
              <div>{{ item.amount }}</div>
            </div>
          </div>
        </div>

        <div v-if="itemList.length === 0" class="w-[250px]">
          You do not have any items in your inventory.
        </div>
      </div>
      <div> 
        <section class="form max-w-[20rem]">
          <div class="form-tabs">
            <div class="tab" :class="{ active: tabView === 'instant' }" @click="changeView('instant')">Instant</div>
            <div class="tab" :class="{ active: tabView === 'battle' }" @click="changeView('battle')">Battle</div>
            <div class="tab" :class="{ active: tabView === 'special' }" @click="changeView('special')">Special</div>
          </div>

          <div v-if="tabView === 'instant'">
            <label>Use item</label>
            <select v-model="selected" v-if="usableItems.length > 0">
              <option v-for="item of usableItems" :key="item.id" :value="item.id">{{ item.name }} ({{ item.amount }})</option>
            </select>

            <label>Target</label>
            <!--
            <input type="text" v-model="target" />
            -->

            <Autocomplete 
              v-if="!target"
              @selected-value="setAutoComplete"
              :options-fn="searchMageRank" 
            />
            <div v-else class="flex flex-row items-center gap-[5px] mb-4 text-[#18d]">
              <div>{{ target.label }} (#{{ target.id}})</div>
              <svg-icon name="remove" size="1.5rem" @click="target = null" /> 
            </div>

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
  </main>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import ActionButton from '@/components/action-button.vue';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMageStore } from '@/stores/mage';
import { getItems } from '@/util/util';
import ImageProxy from '@/components/ImageProxy.vue';
import Autocomplete from '@/components/autocomplete.vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@/composables/useLayout';
import { MageRank } from 'shared/types/common';
import { AutocompleteCandidate } from 'shared/src/common';
import SvgIcon from '@/components/svg-icon.vue';

const route = useRoute();

const selected = ref('');
const turns = ref<number>(1);
const target = ref<AutocompleteCandidate | null>(null);
const itemResult = ref<any[]>([]);

const tabView = ref('instant');

const changeView = (v: string) => {
  tabView.value = v;
  selected.value = '';
};

const mageStore = useMageStore();
const { layout } = useLayout();

const { mage } = storeToRefs(mageStore);

const itemList = computed(() => {
  if (!mage.value) return [];

  let result = getItems(mage.value);
  return result.sort((a, b) => a.id.localeCompare(b.id));
});

const numItems = computed(() => {
  return Object.values(mage.value!.items).reduce((acc, v) => acc + v, 0);
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


const searchMageRank = async (val: string) => {
  const results = await API.get<MageRank[]>(`/search-mage?searchStr=${val}`);
  return results.data.map(d => {
    return { 
      label: d.name, id: d.id.toString() 
    };
  });
}

const setAutoComplete = (val: any) => {
  target.value = val;
}

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

onMounted(async () => {
  const targetId = route.query.targetId;
  if (targetId && +targetId > 0) {
    changeView('instant');

    try {
      const m = (await API.get<MageRank>(`mage/${targetId}`)).data;
      target.value = {
        id: '' + m.id,
        label: m.name
      };
    } catch (err) {
      target.value = null;
    }
  }
});

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
