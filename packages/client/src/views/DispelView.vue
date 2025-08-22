<template>
  <div> Your enchantments </div>
  <table>
    <tbody>
      <tr v-for="(enchant) of selfEnchantments" :key="enchant.id"> 
        <td> <magic :magic="enchant.spellMagic" /></td>
        <td> {{enchant.spellId}}</td>
        <td>{{enchant.isPermanent ? "-" : enchant.life}}</td>
        <td>{{enchant.spellLevel}}</td>
        <td>#{{enchant.casterId}}</td>
      </tr>
    </tbody>
  </table>

  <br/>
  <div> Other enchantments </div>
  <table>
    <tbody>
      <tr v-for="(enchant) of otherEnchantments" :key="enchant.id"> 
        <td> <magic :magic="enchant.spellMagic" /></td>
        <td> {{enchant.spellId}}</td>
        <td>{{enchant.isPermanent ? "-" : enchant.life}}</td>
        <td>{{enchant.spellLevel}}</td>
        <td>#{{enchant.casterId}}</td>
      </tr>
    </tbody>
  </table>

  <input type="number" />
  <button>Dispel</button>
</template>

<script lang="ts" setup>
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import Magic from '@/components/magic.vue';
const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);

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


