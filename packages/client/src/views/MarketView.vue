<template>
  <main>
    <div class="section-header">Market</div>
    <p>Trade and bid on exotic goods</p>
    <div class="row">
      <img src="@/assets/images/market.png" class="gen-img" />
    </div>

    <section class="form">
      <select style="width: 10rem" v-model="currentSelection" @change="changeSelection">
        <option value="item">Items</option>
        <option value="spell">Spells</option>
      </select>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const currentSelection = ref('item');

const changeSelection = () => {
}


</script>


