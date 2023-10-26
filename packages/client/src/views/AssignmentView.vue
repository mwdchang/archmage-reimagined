<template>
  <div class="section-header">Assign magic and item for defence</div>

  <table>
    <tr>
      <td> Spell for defence </td>
      <td>
        <select></select>
      </td>
    </tr>
    <tr>
      <td> Condition</td>
      <td>
        <select>
          <option v-for="c of activateConditions" :key="c" :value="c">{{ c }} %</option>
        </select>
      </td>
    </tr>

    <tr>
      <td> Item for defence </td>
      <td>
        <select>
          <option v-for="item of usableItems" :key="item.id" :value="item.id">{{ item.name }} ({{ item.amount }} )</option>
        </select>
      </td>
    </tr>
    <tr>
      <td> Condition </td>
      <td>
        <select>
          <option v-for="c of activateConditions" :key="c" :value="c">{{ c }} %</option>
        </select>
      </td>
    </tr>

  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia'
import { getItemById } from 'engine/src/base/references';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const activateConditions = [0, 25, 50, 75, 100];

// FIXME: composable
const itemList = computed(() => {
  if (!mage.value) return [];

  let result: MageItem[] = [];
  Object.keys(mage.value.items).forEach(key => {
    const item = getItemById(key);
    result.push({
      id: key,
      name: item.name,
      attributes: item.attributes,
      amount: mage.value?.items[key] as number
    });
  });
  return result;
});

const usableItems = computed(() => {
  return itemList.value.filter(item => {
    const attrs = item.attributes;
    return attrs.includes('oneUse') && attrs.includes('battle');
  });
});


</script>
