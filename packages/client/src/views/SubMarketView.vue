<template>
  <main>
    <div class="section-header">Market: {{ readableStr(priceId) }}</div>
    <div class="row" style="margin-bottom: 10px">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <market-table 
      v-if="bidItems.length > 0"
      v-model="bidItems" 
    />

    <section class="form">
      <button @click="makeBid"> Bid </button>
    </section>
    <div v-if="errorStr" class="error">{{ errorStr }}</div>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import MarketTable from '@/components/market-table.vue';
import { useMageStore } from '@/stores/mage';
import { readableStr } from '@/util/util';
import { MarketItem, Bid, BidContainer } from 'shared/types/market';
import { Mage } from 'shared/types/mage';

const props = defineProps<{ 
  priceId: string;
}>(); 

const mageStore = useMageStore();
const bidItems = ref<BidContainer[]>([]);
const errorStr = ref('');

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
  await refresh();
}

onMounted(async() => {
  await refresh();
});
</script>
