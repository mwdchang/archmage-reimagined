<template>
  <table>
    <tr v-for="spell of spells" :key="spell.id">
      <td>{{ spell.name }}</td>
      <td><magic :magic="spell.magic" /></td>
      <td>{{ spell.castingTurn }}</td>
      <td>{{ spell.castingCost }}</td>
    </tr>
  </table>

  <br>
  <select v-model="selected">
    <option v-for="spell of castingSpells" :key="spell.id" :value="spell.id">{{ spell.name }}</option>
  </select>
  <button @click="castSpell">Cast spell</button>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getSpellById } from 'engine/src/magic';
import { magicAlignmentTable } from 'engine/src/config';
import { Spell } from 'shared/types/magic';
import Magic from '@/components/magic.vue';

const mageStore = useMageStore();

const selected = ref<string>('');

const spellDisplay = (spell: Spell, magic: string) => {
  return {
    id: spell.id,
    magic: spell.magic,
    name: spell.name,
    castingCost: spell.castingCost * magicAlignmentTable[magic].costModifier[spell.magic],
    castingTurn: spell.castingTurn
  };
}

const spells = computed(() => {
  const mage = mageStore.mage; 
  if (!mage) return [];

  const result: any = [];
  mage.spellbook.ascendant.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.verdant.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.eradication.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.nether.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });
  mage.spellbook.phantasm.forEach(spellId => {
    const spell = getSpellById(spellId);
    result.push(spellDisplay(spell, mage.magic));
  });

  if (result.length) selected.value = result[0].id;

  return result;
});


const castingSpells = computed(() => {
  return spells.value.filter(d => d.castingTurn > 0);
})


const castSpell = async () => {
  const res = (await API.post('summon', { spellId: selected.value, num: 1 })).data;
  if (res.mage) {
    mageStore.setMage(res.mage);
    console.log('!!', res.r);
  }
}

</script>
