<template>
  <main>
    <div class="section-header">Market: {{ readableStr(priceId) }}</div>
    <div class="row" style="margin-bottom: 10px">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <table style="margin-bottom: 10px">
      <thead>
        <tr>
          <th> Name </th>
          <th> Minimum price</th>
          <th> Time remaining </th>
          <th> # bids</th>
          <th> Your bid </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item of bidItems" :key="item.marketItem.id">
          <td>{{ readableStr(item.marketItem.priceId) }} </td>
          <td class="text-right">{{ readbleNumber(item.marketItem.basePrice) }} </td>
          <td class="text-right">
            <!--{{ item.marketItem.expiration }} / -->
            {{ timeRemaining(item.marketItem) }} min
          </td>
          <td>
            {{ currentBidMap[item.marketItem.id] ? currentBidMap[item.marketItem.id] : 0 }}
          </td>
          <td class="text-right">
            <div v-if="mageBidMap[item.marketItem.id]">
              {{ readbleNumber(mageBidMap[item.marketItem.id]) }}
            </div>
            <div v-else>
              <input type="number" v-model="item.bid" /> 
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <section class="form">
      <button @click="makeBid"> Bid </button>
    </section>

  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { readableStr, readbleNumber } from '@/util/util';
import { MarketItem, MarketBid, Bid } from 'shared/types/market';
import { ServerClock } from 'shared/types/common';

const mageStore = useMageStore();
const mage = mageStore.mage!;

interface BidContainer {
  marketItem: MarketItem,
  bid: number
}

const props = defineProps<{ 
  priceId: string;
}>(); 

const clock = ref<ServerClock|null>(null);

const bidItems = ref<BidContainer[]>([]);
const currentBidMap = ref<{[key: string]: number}>({});
const mageBidMap = ref<{[key: string]: number}>({});

const timeRemaining = (marketItem: MarketItem) => {
  if (!clock.value) return '';

  const turns = (marketItem.expiration - clock.value.currentTurn);
  const remainTime = (turns * clock.value.interval + clock.value.currentTurnTime) - Date.now();
  return (remainTime / 1000 / 60).toFixed(2);
}

const refresh = async () => {
  const itemList = (await API.get<MarketItem[]>(`/market-items`)).data.filter(d => {
    return d.priceId === props.priceId;
  });

  bidItems.value = [];
  for (const item of itemList) {
    bidItems.value.push({
      marketItem: item,
      bid: 0
    })
  }
  const bidList = (await API.get<MarketBid[]>(`/market-bids/${props.priceId}`)).data;
  for (const bid of bidList) {
    if (currentBidMap.value[bid.marketId]) {
      currentBidMap.value[bid.marketId] ++;
    } else {
      currentBidMap.value[bid.marketId] = 1;
    }

    if (bid.mageId === mage.id) {
      mageBidMap.value[bid.marketId] = bid.bid;
    }
  }
};

const makeBid = async () => {
  const payload: Bid[] = bidItems.value
    .filter(d => d.bid >= 0)
    .map(d => { 
      return { marketId: d.marketItem.id, bid: d.bid }
    });

  const result = await API.post('/market-bids', payload);
  await refresh();
}


onMounted(async() => {
  await refresh();
  clock.value = (await API.get<ServerClock>('/server-clock')).data;
});

</script>
