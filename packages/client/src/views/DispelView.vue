<template>
  <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
    <ImageProxy src="/images/ui/dispel.png" />
    <div>
      <div class="section-header">Dispel Magic</div>
      <div>
        You can undo enchantments that others casted on you, or spells you casted on yourself.
        Success depends on how much mana you use to undo the enchantment.
      </div>
    </div>
  </div>

  <div> Your enchantments in effect </div>
  <table>
    <thead>
      <tr>
        <th>&nbsp</th>
        <th>Enchantment</th>
        <th>Life</th>
        <th>Spell level</th>
        <th>Caster</th>
        <th>Target</th>
        <th>&nbsp;</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(enchant) of selfEnchantments" :key="enchant.id"> 
        <td> <magic :magic="enchantMagic(enchant)" /></td>
        <td>{{readableStr(enchant.spellId)}}</td>
        <td>{{enchant.isPermanent ? "-" : enchant.life}}</td>
        <td>{{enchant.spellLevel}}</td>
        <td>#{{enchant.casterId}}</td>
        <td>#{{enchant.targetId}}</td>
        <td><input type="radio" name="dispel" v-model="selectedEnchant" :value="enchant.id"></td>
      </tr>
    </tbody>
  </table>

  <br/>
  <div> Other enchantments in effect </div>
  <table>
    <thead>
      <tr>
        <th>&nbsp</th>
        <th>Enchantment</th>
        <th>Life</th>
        <th>Spell level</th>
        <th>Caster</th>
        <th>Target</th>
        <th>&nbsp;</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(enchant) of otherEnchantments" :key="enchant.id"> 
        <td> <magic :magic="enchantMagic(enchant)" /></td>
        <td>{{readableStr(enchant.spellId)}}</td>
        <td>{{enchant.isPermanent ? "-" : enchant.life}}</td>
        <td>{{enchant.spellLevel}}</td>
        <td>#{{enchant.casterId}}</td>
        <td>#{{enchant.targetId}}</td>
        <td><input type="radio" name="dispel" v-model="selectedEnchant" :value="enchant.id"></td>
      </tr>
    </tbody>
  </table>
  <br/>

  <section class="form">
    <input type="number" v-model="dispelMana" />
    <label>Success rate: {{ (100 * dispelProb).toFixed(2) }}%</label>
    <ActionButton 
      :proxy-fn="dispelEnchant"
      :label="'Dispel'" />

  </section>
  <div v-if="resultStr">{{ resultStr }}</div>
  <div v-if="errorStr" class="error">{{ errorStr }}</div>
</template>

<script lang="ts" setup>
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import Magic from '@/components/magic.vue';
import ActionButton from '@/components/action-button.vue';
import { dispelEnchantment } from 'engine/src/magic';
import { readableStr, enchantMagic } from '@/util/util';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

const selectedEnchant = ref<string>('');
const dispelMana = ref<number>(0);

const resultStr = ref('');
const errorStr = ref('');

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
  return dispelEnchantment(mage.value!, enchantment, dispelMana.value);
});

const dispelEnchant = async () => {
  if (selectedEnchant.value === '') return;

  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    resultStr.value = '';
    return API.post('dispel', { 
      enchantId: selectedEnchant.value,
      mana: dispelMana.value
    });
  });
  
  if (error) {
    errorStr.value = error
  }

  if (data) {
    if (data.result) {
      resultStr.value = `You dispelled ${selectedEnchant.value}`;
    }
    mageStore.setMage(data.mage);
  }
};
</script>

<style scoped>
</style>

