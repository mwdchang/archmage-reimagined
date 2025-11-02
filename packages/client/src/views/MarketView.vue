<template>
  <main>
    <div class="section-header">Market</div>
    <p>Trade and bid on exotic goods</p>
    <div class="row">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <section class="form" style="margin-bottom: 10px">
      <select style="width: 10rem; margin-bottom: 0" v-model="currentSelection" @change="changeSelection">
        <option value="item">Antique Store</option>
        <option value="spell">Exotic Mageware</option>
        <option value="unit">Spawning Hatchery</option>
      </select>
    </section>


    <section v-if="bidItems.length > 0 && currentSelection !== 'item'">
      <market-table v-model="bidItems" />
      <div class="form">
        <button @click="makeBid"> Bid </button>
      </div>
      <div v-if="errorStr" class="error">{{ errorStr }}</div>
    </section>


    <table v-if="currentSelection === 'item'">
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
import { MarketItem, MarketPrice, BidContainer, Bid } from 'shared/types/market';
import { readableStr } from '@/util/util';
import { useMageStore } from '@/stores/mage';
import MarketTable from '@/components/market-table.vue';
import { Mage } from 'shared/types/mage';

const props = defineProps<{ type: string }>(); 
const router = useRouter();

const mageStore = useMageStore();
const currentSelection = ref('item');
const priceTypeMap: Record<string, string> = {};
const itemList = ref<MarketItem[]>([]);
const errorStr = ref('');

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

const bidItems = ref<BidContainer[]>([]);

const refresh = () => {
  if (currentSelection.value === 'item') {
    // Items
    const itemGroups = _.groupBy(itemList.value, d => d.priceId);
    const finalList: ItemSummary[] = [];

    Object.keys(itemGroups).forEach(key => {
      finalList.push({
        priceId: key,
        amount: itemGroups[key].length
      });
    });
    items.value = finalList.sort((a, b) => a.priceId.localeCompare(b.priceId));
  } else {
    // Spells, units
    bidItems.value = [];
    for (const item of itemList.value) {
      if (priceTypeMap[item.priceId] === currentSelection.value) {
        bidItems.value.push({
          marketItem: item,
          bid: 0
        })
      }
    };
  }
};


const makeBid = async () => {
  const badBids = bidItems.value.filter(item => {
    return item.bid > 0 && item.bid <= item.marketItem.basePrice;
  });
  if (badBids.length > 0) {
    errorStr.value = 'You cannot bid less than the base prices';
    return;
  }

  const payload: Bid[] = bidItems.value
    .filter(d => d.bid >= 0)
    .map(d => { 
      return { marketId: d.marketItem.id, bid: d.bid }
    });

  const result = (await API.post<{mage: Mage}>('/market-bids', payload)).data;

  mageStore.setMage(result.mage);
  refresh();
}



onMounted(async () => {
  itemList.value = (await API.get<MarketItem[]>('/market-items')).data;
  const priceList = (await API.get<MarketPrice[]>('/market-prices')).data;

  for (const price of priceList) {
    priceTypeMap[price.id] = price.type;
  }

  refresh();
});



watch(
  () => props.type,
  () => {
    if (!props.type) return;
    currentSelection.value = props.type;
  refresh();
  },
  { immediate: true }
)

</script>

