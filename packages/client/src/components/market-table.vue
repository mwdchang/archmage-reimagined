<template>
  <table style="margin-bottom: 10px" v-if="ready">
    <thead>
      <tr>
        <th> Name </th>
        <th v-if="modelValue[0].marketItem.extra"> Number </th>
        <th> Minimum price</th>
        <th> Time remaining </th>
        <th> # bids</th>
        <th> Your bid </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item of modelValue" :key="item.marketItem.id">
        <td>
          {{ readableStr(item.marketItem.priceId) }} 
        </td>
        <td v-if="item.marketItem.extra" class="text-right">
          {{ readableNumber(item.marketItem.extra.size) }}
        </td>
        <td class="text-right">{{ readableNumber(item.marketItem.basePrice) }} </td>
        <td class="text-right">
          {{ timeRemaining(item.marketItem) }} min
        </td>
        <td class="text-right">
          {{ currentBidMap[item.marketItem.id] ? currentBidMap[item.marketItem.id] : 0 }}
        </td>
        <td class="text-right">
          <div v-if="mageBidMap[item.marketItem.id]">
            {{ readableNumber(mageBidMap[item.marketItem.id]) }}
          </div>
          <div v-else>
            <input type="number" v-model="item.bid" /> 
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import _ from 'lodash';
import type { BidContainer, MarketItem, MarketBid } from 'shared/types/market';
import { API } from '@/api/api';
import { ServerClock } from 'shared/types/common';
import { readableStr, readableNumber } from '@/util/util';
import { onMounted, ref, watch } from 'vue';
import { useMageStore } from '@/stores/mage';

const props = defineProps<{ modelValue: BidContainer[] }>()

const mageStore = useMageStore();
const mage = mageStore.mage!;

const ready = ref(false);
const clock = ref<ServerClock|null>(null);
const currentBidMap = ref<{[key: string]: number}>({});
const mageBidMap = ref<{[key: string]: number}>({});

const timeRemaining = (marketItem: MarketItem) => {
  if (!clock.value) return '';

  const turns = (marketItem.expiration - clock.value.currentTurn);
  const remainTime = (turns * clock.value.interval + clock.value.currentTurnTime) - Date.now();
  return (remainTime / 1000 / 60).toFixed(0);
}


const refresh = async () => {
  const priceIds = _.uniq(
    props.modelValue.map(d => d.marketItem.priceId)
  );

  const bidList = (await API.get<MarketBid[]>(`/market-bids/${priceIds.join(',')}`)).data;
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
  ready.value = true;
}

watch(
  () => props.modelValue,
  () => {
    refresh();
  }
)

onMounted(async () => {
  clock.value = (await API.get<ServerClock>('/server-clock')).data;
  await refresh();
});

</script>
