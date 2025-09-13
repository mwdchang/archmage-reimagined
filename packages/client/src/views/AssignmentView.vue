<template>
  <div class="section-header">Assign magic and item for defence</div>

  <section class="form">
    <div class="row" style="align-items: baseline">
      <label style="width: 12rem"> Spell for defence </label>
      <select v-model="selectedSpellId" @change="setAssignment()">
        <option v-for="spell of usableSpells" :key="spell.id" :value="spell.id">{{ spell.name }} </option>
      </select>
    </div>

    <div class="row" style="align-items: baseline">
      <label style="width: 12rem"> Spell condition</label>
      <select v-model="selectedSpellCondition" @change="setAssignment()">
        <option v-for="c of activateConditions" :key="c" :value="c">{{ conditionString(c) }}</option>
      </select>
    </div>

    <div class="row" style="align-items: baseline">
      <label style="width: 12rem"> Item for defence </label>
      <select v-model="selectedItemId" @change="setAssignment()">
        <option v-for="item of usableItems" :key="item.id" :value="item.id">{{ item.name }} ({{ item.amount }} )</option>
      </select>
    </div>

    <div class="row" style="align-items: baseline">
      <label style="width: 12rem"> Item condition </label>
      <select v-model="selectedItemCondition" @change="setAssignment()" style="margin-bottom: 0">
        <option v-for="c of activateConditions" :key="c" :value="c">{{ conditionString(c) }}</option>
      </select>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia'
import { getItemById } from 'engine/src/base/references';
import { MageItem, getSpells, conditionString } from '@/util/util';
import { Mage } from '../../../shared/types/mage';
import { API } from '@/api/api';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const selectedSpellId = ref(mage.value?.assignment.spellId);
const selectedSpellCondition = ref(mage.value?.assignment.spellCondition);
const selectedItemId = ref(mage.value?.assignment.itemId);
const selectedItemCondition = ref(mage.value?.assignment.itemCondition);

const activateConditions = [-1, 0, 25, 50, 75, 100];

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
  const result = itemList.value.filter(item => {
    const attrs = item.attributes;
    return attrs.includes('oneUse') && attrs.includes('battle');
  });

  // Add none option
  const noItem = {
    id: '',
    name: 'None',
    attributes: [],
    amount: 0
  }
  result.unshift(noItem);

  return result;
});

const usableSpells = computed(() => {
  const mage = mageStore.mage; 
  if (!mage) return [];
  const result = getSpells(mage).filter((spell: any) => spell.attributes.includes('battle'));

  // Add none option
  const noSpell = {
    id: '',
    magic: '',
    name: 'None',
    castingCost: 0,
    castingTurn: 0,
    attributes: []
  };
  result.unshift(noSpell);

  return result;
});

const setAssignment = async () => {
  const res = await API.post('/defence-assignment', {
    spellId: selectedSpellId.value,
    spellCondition: selectedSpellCondition.value,
    itemId: selectedItemId.value,
    itemCondition: selectedItemCondition.value
  });

  if (res.data) {
    mageStore.setMage(res.data.mage as Mage);
  }
};

</script>
