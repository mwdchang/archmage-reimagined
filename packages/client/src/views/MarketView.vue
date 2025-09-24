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
      </select>
    </section>
    <table>
      <tbody>
        <tr v-for="item of items" :key="item.itemId">
          <td> {{ readableStr(item.itemId) }} </td>
          <td> {{ item.amount }} </td>
          <td> 
            <router-link :to="{ name: 'marketBid', params: { itemId: item.itemId }}"> Bid </router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script lang="ts" setup>
import _ from 'lodash';
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import { MarketItem } from 'shared/types/market';
import { readableStr } from '@/util/util';

const currentSelection = ref('item');

const changeSelection = () => {}

interface ItemSummary {
  itemId: string;
  amount: number;
}

const items = ref<ItemSummary[]>([]);

onMounted(async () => {
  const itemList = (await API.get<MarketItem[]>('/market-items')).data;

  const itemGroups = _.groupBy(itemList, d => d.itemId);
  const finalList: ItemSummary[] = [];

  Object.keys(itemGroups).forEach(key => {
    finalList.push({
      itemId: key,
      amount: itemGroups[key].length
    });
  });

  items.value = finalList.sort((a, b) => a.itemId.localeCompare(b.itemId));
})

</script>

