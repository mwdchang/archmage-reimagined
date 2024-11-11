<template>
  <div class="section-header">Spells in your Spellbook</div>
  <br>
  <table>
    <tr v-for="spell of spells" :key="spell.id">
      <td>{{ spell.name }}</td>
      <td><magic :magic="spell.magic" /></td>
      <td class="text-right">{{ spell.castingTurn }}</td>
      <td class="text-right">{{ spell.castingCost }}</td>
    </tr>
  </table>

  <br>
  <select v-model="selected" v-if="spells.length > 0">
    <option v-for="spell of castingSpells" :key="spell.id" :value="spell.id">{{ spell.name }}</option>
  </select>
  <p v-if="spells.length === 0">
    You have no spells available.
  </p>

  <div>Target</div>
  <input type="text" v-model="target" />

  <div># of times</div> 
  <input type="text" v-model="turns" />

  <button @click="castSpell">Cast spell</button>

  <div v-if="spellResult.length">
    <div v-for="(d, idx) of spellResult" :key="idx">
      {{ d.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getSpells } from '@/util/util';
import Magic from '@/components/magic.vue';

const mageStore = useMageStore();

const selected = ref<string>('');
const turns = ref<number>(1);
const target = ref<string>('');

const spellResult = ref<any[]>([]);

const spells = computed(() => {
  const mage = mageStore.mage; 
  if (!mage) return [];

  const result = getSpells(mage);
  return result;
});


const castingSpells = computed(() => {
  return spells.value.filter(d => d.castingTurn > 0);
})

const castSpell = async () => {
  if (!selected.value) return;

  const res = (await API.post('spell', { 
    spellId: selected.value, 
    num: turns.value, 
    target: target.value 
  })).data;

  if (res.r) {
    spellResult.value = res.r;
  }

  if (res.mage) {
    mageStore.setMage(res.mage);
  }
}

</script>

<style scoped>
tr:nth-child(odd) {
  background: #333;
}
</style>
