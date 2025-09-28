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
      <thead>
        <tr>
          <th>Item name</th>
          <th># available</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item of items" :key="item.priceId">
          <td> 
            <router-link :to="{ name: 'viewItem', params: { id: item.priceId }}"> 
              {{ readableStr(item.priceId) }} 
            </router-link>
          </td>
          <td class="text-right"> {{ item.amount }} </td>
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
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import { MarketItem } from 'shared/types/market';
import { readableStr } from '@/util/util';

const currentSelection = ref('item');

const changeSelection = () => {}

interface ItemSummary {
  priceId: string;
  amount: number;
}

const items = ref<ItemSummary[]>([]);

onMounted(async () => {
  const itemList = (await API.get<MarketItem[]>('/market-items')).data;

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

</script>

