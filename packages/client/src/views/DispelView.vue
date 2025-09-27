<template>
  <div class="section-header">Dispel Magic</div>
  <div> Your enchantments in effect </div>
  <table>
    <tbody>
      <tr v-for="(enchant) of selfEnchantments" :key="enchant.id"> 
        <td> <magic :magic="enchantMagic(enchant)" /></td>
        <td>{{readableStr(enchant.spellId)}}</td>
        <td>{{enchant.isPermanent ? "-" : enchant.life}}</td>
        <td>{{enchant.spellLevel}}</td>
        <td>#{{enchant.casterId}}</td>
        <td><input type="radio" name="dispel" v-model="selectedEnchant" :value="enchant.id"></td>
      </tr>
    </tbody>
  </table>

  <br/>
  <div> Other enchantments in effect </div>
  <table>
    <tbody>
      <tr v-for="(enchant) of otherEnchantments" :key="enchant.id"> 
        <td> <magic :magic="enchantMagic(enchant)" /></td>
        <td>{{readableStr(enchant.spellId)}}</td>
        <td>{{enchant.isPermanent ? "-" : enchant.life}}</td>
        <td>{{enchant.spellLevel}}</td>
        <td>#{{enchant.casterId}}</td>
      </tr>
    </tbody>
  </table>
  <br/>

  <section class="form">
    <input type="number" v-model="dispelMana" />
    <label>Success rate for {{ dispelProb }}%</label>
    <button @click="dispelEnchant">Dispel</button>
  </section>
</template>

<script lang="ts" setup>
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import Magic from '@/components/magic.vue';
import { dispelEnchantment } from 'engine/src/magic';
import { readableStr, enchantMagic } from '@/util/util';
import { Enchantment } from 'shared/types/mage';
import { getSpellById } from 'engine/src/base/references';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const selectedEnchant = ref<string>('');
const dispelMana = ref<number>(0);


const selfEnchantments = computed(() => {
  return mage.value?.enchantments.filter(d => {
    return d.casterId === mage.value?.id;
  });
});

const otherEnchantments = computed(() => {
  return mage.value?.enchantments.filter(d => {
    return d.casterId !== mage.value?.id && d.casterId !== 0;
  });
});

const dispelProb = computed(() => {
  if (selectedEnchant.value === '') return 0;
  const enchantment = mage.value?.enchantments.find(d => d.id === selectedEnchant.value);
  if (!enchantment) return 0;
  return dispelEnchantment(mage.value!, enchantment, dispelMana.value) * 100;
});

const dispelEnchant = async () => {
  if (selectedEnchant.value === '') return;
  if (dispelMana.value <= 0) return;

  const res = (await API.post('dispel', { 
    enchantId: selectedEnchant.value,
    mana: dispelMana.value
  })).data;

  if (res.mage) {
    mageStore.setMage(res.mage);
  }
};
</script>

<style scoped>
.enchant-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
</style>


