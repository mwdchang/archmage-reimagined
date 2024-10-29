<template>
  <main v-if="mageStore.mage">
    <h3>Research</h3>
    <p> 
      You are generating {{ rp }} research points per turn. Your magic item generation rate is {{ itemRate }}%.
    </p>
    <table v-if="currentResearch">
      <tbody>
        <tr>
          <td>&nbsp;</td>
          <td>Spell</td>
          <td>Cost (points)</td>
          <td>Turns</td>
        </tr>
        <tr v-for="(magic, _idx) in filteredMagicTypes" :key="magic" 
          :class="{active: currentResearch[magic].active}"
          @click="toggle(magic)">
          <td> <magic :magic="magic" /></td>
          <td>
            {{ currentResearch[magic].id }}
          </td>
          <td class="text-right">
            {{ currentResearch[magic].remainingCost }}
          </td>
          <td class="text-right">
            {{ Math.ceil(currentResearch[magic].remainingCost / rp) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div style="display: flex; align-items: center; margin-top: 10px">
      <input type="checkbox" v-model="focusResearch" style="width:18px; height: 18px" />
      &nbsp;Research all spells of this magic
    </div>
    <div style="display: flex; align-items: center; margin-top: 10px">
      Spend&nbsp;<input type="number" v-model="turns" style="width: 4rem" />&nbsp;turns to reearch faster.
    </div>
    <div style="display: flex; align-items: center; margin-top: 10px">
      <button @click="submitResearch"> Research </button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import magic from '@/components/magic.vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { magicTypes } from 'engine/src/base/references';
import { itemGenerationRate, researchPoints } from 'engine/src/magic';
import { Mage } from '../../../shared/types/mage';
const mageStore = useMageStore();

const rp = computed(() => {
  return researchPoints(mageStore.mage as Mage);
});

const itemRate = computed(() => {
  return (100 * itemGenerationRate(mageStore.mage as Mage)).toFixed(2);
});

const currentResearch = ref(mageStore.mage?.currentResearch);
const focusResearch = ref(mageStore.mage?.currentResearchFocus ? true : false);
const turns = ref(0);

const filteredMagicTypes = computed(() => {
  return magicTypes.filter(m => {
    return mageStore.mage?.currentResearch[m];
  });
});

const toggle = (magic: string) => {
  filteredMagicTypes.value.forEach(d => {
    currentResearch.value[d].active = false;
  });
  currentResearch.value[magic].active = true;
}

const submitResearch = async () => {
  let magic: any = null;
  filteredMagicTypes.value.forEach(m => {
    if (currentResearch.value[m].active === true) {
      magic = m;
    }
  });
  const result = await API.post('research', {
    magic,
    focus: focusResearch.value,
    turns: turns.value
  });

  mageStore.setMage(result.data.mage as Mage);
  currentResearch.value = mageStore.mage?.currentResearch;
  console.log('doh', currentResearch.value);
  focusResearch.value = mageStore.mage?.focusResearch as boolean;
};

</script>

<style scoped>
table > tr {
  cursor: pointer;
}

tr:nth-child(odd) {
  background: #333;
}
</style>
