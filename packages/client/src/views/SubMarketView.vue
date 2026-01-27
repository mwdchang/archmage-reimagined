<template>
  <main>
    <div class="section-header">Market</div>
    <div class="row" style="margin-bottom: 10px">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <div style="margin-bottom: 0.5rem">
      Bidding status for 
      <router-link :to="{ name: 'viewItem', params: { id: priceId }}"> 
        {{ readableStr(priceId) }} 
      </router-link>
    </div>

    <market-table 
      v-if="bidItems.length > 0"
      v-model="bidItems" 
      item-type="item"
      :show-name="false"
    />

    <section class="form">
      <ActionButton 
        :proxy-fn="makeBid"
        :label="'Bid'" />

    </section>
    <div v-if="errorStr" class="error">{{ errorStr }}</div>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import MarketTable from '@/components/market-table.vue';
import ActionButton from '@/components/action-button.vue';
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
  const gameTable = mageStore.gameTable!;

  const badBids = bidItems.value.filter(item => {
    return item.bid > 0 && item.bid <= item.marketItem.basePrice * (1 + gameTable.blackmarket.minimum);
  });
  if (badBids.length > 0) {
    errorStr.value = `Bids must be ${gameTable.blackmarket.minimum * 100} % higher than base prices`;
    return;
  }

  const payload: Bid[] = bidItems.value
    .filter(d => d.bid >= 0)
    .map(d => { 
      return { marketId: d.marketItem.id, bid: d.bid }
    });

  errorStr.value = '';
  const result = (await API.post<{mage: Mage}>('/market-bids', payload)).data;
  mageStore.setMage(result.mage);
  await refresh();
}

onMounted(async() => {
  await refresh();
});
</script>
