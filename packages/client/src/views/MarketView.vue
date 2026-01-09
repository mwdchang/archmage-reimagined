<template>
  <main>
    <div class="row" style="width: 38rem; margin-bottom: 0.5rem">
      <ImageProxy src="/images/ui/market.png" />
      <div>
        <div class="section-header">Market</div>
        <div>
          Bid on rare, often illicit exotic goods in shadowed alleyways. These shops deal in everything from monsters and cursed relics to legendary heroes, far from the scrutiny of the law.
        </div>
      </div>
    </div>

    <section class="form" style="margin-bottom: 10px">
      <select style="width: 10rem; margin-bottom: 0" v-model="currentSelection" @change="changeSelection">
        <option value="item">Antique Store</option>
        <option value="spell">Exotic Mageware</option>
        <option value="unit">Spawning Hatchery</option>
        <option value="sell">Peddler's Lane</option>
      </select>
    </section>


    <section v-if="bidItems.length > 0 && currentSelection !== 'item'">
      <market-table v-model="bidItems" :item-type="type" :show-name="true" />
      <div class="form">
        <ActionButton 
          :proxy-fn="makeBid"
          :label="'Bid'" />

      </div>
      <div v-if="errorStr" class="error">{{ errorStr }}</div>
      <div>
        {{ sellMsg }}
      </div>

    </section>

    <section v-if="currentSelection === 'sell'">
      <table>
        <thead>
          <tr>
            <th>Item name</th>
            <th>Estimated price</th>
            <th># available</th>
            <th>Sell</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item of itemsToSell" :key="item.itemId">
            <td>{{ readableStr(item.itemId) }}</td>
            <td class="text-right">{{ readableNumber(item.price) }}</td>
            <td class="text-right">{{ item.size }}</td>
            <td>
              <input type="number" v-model="item.sellAmt" style="height: 1.6rem; width: 5rem" /> 
            </td>
          </tr>
        </tbody>
      </table>

      <div class="form">
        <ActionButton 
          :proxy-fn="sellItems"
          :label="'Sell Items'" />

      </div>
      <div v-if="errorStr" class="error">{{ errorStr }}</div>

    </section>


    <table v-if="currentSelection === 'item'" style="min-width: 25rem">
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
import { API, APIWrapper } from '@/api/api';
import { MarketItem, MarketPrice, BidContainer, Bid, SellItem } from 'shared/types/market';
import { readableNumber, readableStr } from '@/util/util';
import { useMageStore } from '@/stores/mage';
import MarketTable from '@/components/market-table.vue';
import ActionButton from '@/components/action-button.vue';
import ImageProxy from '@/components/ImageProxy.vue';
import { Mage } from 'shared/types/mage';

const props = defineProps<{ type: string }>(); 
const router = useRouter();

const mageStore = useMageStore();
const currentSelection = ref('item');
const priceTypeMap: Record<string, string> = {};
const priceMap: Record<string, number> = {};
const itemList = ref<MarketItem[]>([]);

const errorStr = ref('');
const sellMsg = ref('');

const encyclopediaView = computed(() => {
  if (currentSelection.value === 'item') return 'viewItem';
  if (currentSelection.value === 'spell') return 'viewSpell';
  if (currentSelection.value === 'unit') return 'viewUnit';
  return 'viewUnit';
});

const itemsToSell = ref<SellItem[]>([]);

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

const refresh = async () => {
  const priceList = (await API.get<MarketPrice[]>('/market-prices')).data;
  for (const price of priceList) {
    priceTypeMap[price.id] = price.type;
    priceMap[price.id] = price.price;
  }


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

  const temp = Object.entries(mageStore.mage!.items).map(entry => {
    console.log(priceMap[entry[0]]);
    return {
      itemId: entry[0],
      size: entry[1] ,
      price: priceMap[entry[0]] || 0,
      sellAmt: 0
    }
  }).sort((a, b) => a.itemId.localeCompare(b.itemId));
  itemsToSell.value = temp;
};

// This needs a double check server side, as the item being sold might be 
// consumed while selling.
const sellItems = async () => {
  errorStr.value = '';
  sellMsg.value = '';

  const candidates = itemsToSell.value.filter(d => d.sellAmt > 0);
  for (const item of candidates) {
    if (item.sellAmt > item.size) {
      errorStr.value = `You are trying to sell ${item.sellAmt} ${readableStr(item.itemId)} but you only have ${item.size}`;
      return;
    }
  }

  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post('/sell-item', candidates)
  });


  if (data) {
    mageStore.setMage(data.mage);

    const totalNum = candidates.reduce((acc, item) => acc + item.sellAmt, 0);
    sellMsg.value = `You put ${totalNum} items for auction, the proceeds will be sent to your kingdom when the auction concludes`;
    refresh();
  }

  if (error) {
    errorStr.value = error;
  }
}

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

