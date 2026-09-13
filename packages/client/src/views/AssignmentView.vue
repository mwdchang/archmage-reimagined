<template>
  <main>
    <div class="flex flex-row items-center gap-[5px] w-[35rem] max-w-full mb-2">
      <ImageProxy src="/images/ui/assignment.png" />
      <div>
        <div class="section-header">Assignment</div>
        <div>
          Assign the spell and item you want to deploy for defense. Conditions depend on the relative strengths of the opposing armies.
        </div>
      </div>
    </div>

    <section class="form">
      <div class="flex flex-row items-baseline gap-[5px]">
        <label class="w-48"> Spell </label>
        <select v-model="selectedSpellId" @change="setAssignment()">
          <option v-for="spell of usableSpells" :key="spell.id" :value="spell.id">
            {{ spell.name }} <span v-if="spell.id"> ({{ Math.floor(mageStore.mage!.currentMana / spell.castingCost ) }}) </span> 
          </option>
        </select>
      </div>

      <div class="flex flex-row items-baseline gap-[5px]">
        <label class="w-48"> Spell condition</label>
        <select v-model="selectedSpellCondition" @change="setAssignment()">
          <option v-for="c of activateConditions" :key="c" :value="c">{{ conditionString(c) }}</option>
        </select>
      </div>

      <div class="flex flex-row items-baseline gap-[5px]">
        <label class="w-48"> Item </label>
        <select v-model="selectedItemId" @change="setAssignment()">
          <option v-for="item of usableItems" :key="item.id" :value="item.id">
            {{ item.name }} <span v-if="item.id"> ({{ item.amount }}) </span>
          </option>
        </select>
      </div>

      <div class="flex flex-row items-baseline gap-[5px]">
        <label class="w-48"> Item condition </label>
        <select v-model="selectedItemCondition" @change="setAssignment()" class="mb-0">
          <option v-for="c of activateConditions" :key="c" :value="c">{{ conditionString(c) }}</option>
        </select>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia'
import { getItemById } from 'engine/src/base/references';
import { MageItem, getSpells, conditionString } from '@/util/util';
import { Mage } from '../../../shared/types/mage';
import { API } from '@/api/api';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const selectedSpellId = ref(mage.value?.assignment.spellId);
const selectedSpellCondition = ref(mage.value?.assignment.spellCondition);
const selectedItemId = ref(mage.value?.assignment.itemId);
const selectedItemCondition = ref(mage.value?.assignment.itemCondition);

const activateConditions = [-1, 0, 25, 50, 75, 100];

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

  result.sort((a, b) => a.id.localeCompare(b.id));
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
