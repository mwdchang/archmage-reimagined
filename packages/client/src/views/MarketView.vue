<template>
  <main>
    <div class="section-header">Market</div>
    <p>Trade and bid on exotic goods</p>
    <div class="row">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <section class="form" style="margin-bottom: 10px">
      <select style="width: 10rem; margin-bottom: 0" v-model="currentSelection" @change="changeSelection">
        <option value="item">Items</option>
        <option value="spell">Spells</option>
        <option value="unit">Units</option>
      </select>
    </section>

    <table>
      <thead>
        <tr>
          <th>Item name</th>
          <th># available</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item of filterdItems" :key="item.priceId">
          <td> 
            <router-link :to="{ name: encyclopediaView, params: { id: item.priceId }}"> 
              {{ readableStr(item.priceId) }} 
            </router-link>
          </td>
          <td class="text-right"> 
            {{ item.amount }} 
          </td>
          <td> 
            <router-link :to="{ name: 'submarket', params: { priceId: item.priceId }}"> Bid </router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script lang="ts" setup>
import _ from 'lodash';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { API } from '@/api/api';
import { MarketItem, MarketPrice } from 'shared/types/market';
import { readableStr } from '@/util/util';

const props = defineProps<{ type: string }>(); 
const router = useRouter();

const currentSelection = ref('item');
const priceTypeMap: Record<string, string> = {};

const encyclopediaView = computed(() => {
  if (currentSelection.value === 'item') return 'viewItem';
  if (currentSelection.value === 'spell') return 'viewSpell';
  if (currentSelection.value === 'unit') return 'viewUnit';
  return 'viewUnit';
});

const changeSelection = () => {
  router.push({ name: 'market', params: { type: currentSelection.value } });
}

interface ItemSummary {
  priceId: string;
  amount: number;
}

const items = ref<ItemSummary[]>([]);
const filterdItems = computed(() => {
  const selection = currentSelection.value === '' ? 'item' : currentSelection.value;
  return items.value.filter(item => {
    return priceTypeMap[item.priceId] === selection;
  });
});

onMounted(async () => {
  const itemList = (await API.get<MarketItem[]>('/market-items')).data;
  const priceList = (await API.get<MarketPrice[]>('/market-prices')).data;

  for (const price of priceList) {
    priceTypeMap[price.id] = price.type;
  }

  const itemGroups = _.groupBy(itemList, d => d.priceId);
  const finalList: ItemSummary[] = [];

  Object.keys(itemGroups).forEach(key => {
    finalList.push({
      priceId: key,
      amount: itemGroups[key].length
    });
  });

  items.value = finalList.sort((a, b) => a.priceId.localeCompare(b.priceId));
})

watch(
  () => props.type,
  () => {
    if (props.type) {
      currentSelection.value = props.type;
    }
  },
  { immediate: true }
)

</script>

