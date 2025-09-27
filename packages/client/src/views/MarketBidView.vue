<template>
  <main>
    <div class="section-header">Market: {{ readableStr(itemId) }}</div>
    <div class="row" style="margin-bottom: 10px">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <table>
      <thead>
        <tr>
          <th> Name </th>
          <th> Minimum bid</th>
          <th> # bid</th>
          <th> Your bid </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item of items" :key="item.itemId">
          <td>{{ readableStr(item.itemId) }} </td>
          <td>{{ readbleNumber(item.basePrice) }} </td>
          <td>&nbsp;</td>
          <td><input type="number" /> </td>
        </tr>
      </tbody>
    </table>

  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';
import { readableStr, readbleNumber } from '@/util/util';
import { MarketItem } from 'shared/types/market';

const props = defineProps<{ 
  itemId: string
}>(); 

const items = ref<MarketItem[]>([]);


onMounted(async() => {
  const itemList = (await API.get<MarketItem[]>('/market-items')).data;
  items.value = itemList.filter(d => d.itemId === props.itemId);
});

</script>
