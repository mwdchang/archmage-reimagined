<template>
  <main v-if="mageStore.mage">
    <div class="section-header">Research</div>
    <div class="row">
      <img src="@/assets/images/research.png" width="400" class="gen-img" />
    </div>
    <p> 
      Current spell level: {{ currentSpellLevel(mageStore.mage) }} 
      (Max = {{ maxSpellLevel(mageStore.mage) }})
    </p>
    <p> 
      You are generating {{ rp }} research points per turn. <br>
      Your magic item generation rate is {{ itemRate }}%.
    </p>
    <table v-if="currentResearch">
      <tbody>
        <tr>
          <td>&nbsp;</td>
          <td>Spell</td>
          <td>Research cost (points)</td>
          <td>Turns remaining</td>
        </tr>
        <tr v-for="(magic, _idx) in filteredMagicTypes" :key="magic" @click="toggle(magic)" style="cursor: pointer">
          <td> 
            <span class="row">
              <magic :magic="magic" />
              <span style="font-size: 125%">
                {{ currentResearch[magic]!.active ? '&check;' : '' }}
              </span>
            </span>
          </td>
          <td>
            <router-link :to="{ name: 'viewSpell', params: { id: currentResearch[magic]!.id }}"> {{ spellName(currentResearch[magic].id) }} </router-link>
            <!-- {{ currentResearch[magic].id }} -->
          </td>
          <td class="text-right">
            {{ readbleNumber(currentResearch[magic]!.remainingCost) }}
          </td>
          <td class="text-right">
            {{ Math.ceil(currentResearch[magic]!.remainingCost / rp) }}
          </td>
        </tr>
      </tbody>
    </table>

    <section class="form" style="margin-top: 1rem">
      <label>Spend turns to research faster</label>
      <input type="number" v-model="turns" style="width: 6rem" />
      <div class="row" style="align-items: baseline">
        <input type="checkbox" v-model="focusResearch" style="width:15px; height: 15px" />
        <label>&nbsp;Research all spells of this magic</label>
      </div>

      <button @click="submitResearch"> Research </button>
    </section>
    <div style="display: flex; align-items: center; margin-top: 10px; max-width: 25rem;">
      {{ researchResultStr }}
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import magic from '@/components/magic.vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { getSpellById, magicTypes } from 'engine/src/base/references';
import { itemGenerationRate, maxSpellLevel, researchPoints } from 'engine/src/magic';
import { Mage } from '../../../shared/types/mage';
import { readbleNumber, readableStr } from '@/util/util';
import { currentSpellLevel } from 'engine/src/base/mage';

const mageStore = useMageStore();

const rp = computed(() => {
  return researchPoints(mageStore.mage as Mage);
});

const itemRate = computed(() => {
  return (100 * itemGenerationRate(mageStore.mage as Mage)).toFixed(2);
});

const currentResearch = ref(mageStore.mage!.currentResearch);

const focusResearch = ref(mageStore.mage!.focusResearch? true : false);
const turns = ref(0);

const spellName = (id: string) => {
  return getSpellById(id).name;
};

interface ResearchResult {
  [key: string]: string[]
}

const researchResult = ref<ResearchResult|null>(null);
const researchResultStr = computed(() => {
  const newSpells: string[] = [];
  if (researchResult.value === null) return '';
  Object.keys(researchResult.value).forEach(key => {
    researchResult.value![key].forEach(spellId => {
      newSpells.push(readableStr(spellId));
    });
  });
  return `You added ${newSpells.join(', ')} to your spellbook`;
});

const filteredMagicTypes = computed(() => {
  return magicTypes.filter(m => {
    return mageStore.mage?.currentResearch[m];
  });
});

const toggle = (magic: string) => {
  filteredMagicTypes.value.forEach(d => {
    currentResearch.value[d]!.active = false;
  });
  currentResearch.value[magic].active = true;
}

const submitResearch = async () => {
  let magic: any = null;
  filteredMagicTypes.value.forEach(m => {
    if (currentResearch.value[m]!.active === true) {
      magic = m;
    }
  });
  const response = await API.post('research', {
    magic,
    focus: focusResearch.value,
    turns: turns.value
  });
  researchResult.value = response.data.result; 

  mageStore.setMage(response.data.mage as Mage);
  currentResearch.value = mageStore.mage?.currentResearch!;
  focusResearch.value = mageStore.mage?.focusResearch as boolean;
};

</script>

<style scoped>
main {
  max-width: 40rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

table > tr {
  max-width: 40rem;
  cursor: pointer;
}

tr:nth-child(odd) {
  background: #222222;
}
</style>
