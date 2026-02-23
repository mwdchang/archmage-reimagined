<template>
  <main v-if="mageStore.mage">
    <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
      <ImageProxy src="/images/ui/research.png" />
      <div>
        <div class="section-header">Research</div>
        <div>
          You guilds are generating {{ rp }} research points per turn. Your item generation rate is {{ itemRate }}%.
          <br/>
          Your current spell level is {{ currentSpellLevel(mageStore.mage) }}, your maximum spell level is {{ maxSpellLevel(mageStore.mage) }}
        </div>
      </div>
    </div>

    <table v-if="currentResearch && hasResearchRemaining"> 
      <tbody>
        <tr>
          <td colspan="2">&nbsp;</td>
          <td>Spell</td>
          <td>Cost (points)</td>
          <td>Turns remaining</td>
        </tr>
        <tr v-for="(magic, _idx) in filteredMagicTypes" :key="magic" @click="toggle(magic)" style="cursor: pointer">
          <td>
            <span style="font-size: 125%">
              {{ currentResearch[magic]!.active ? '&check;' : '' }}
            </span>
          </td>
          <td> 
            <magic :magic="magic" />
          </td>
          <td>
            <router-link :to="{ name: 'viewSpell', params: { id: currentResearch[magic]!.id }}"> {{ spellName(currentResearch[magic].id) }} </router-link>
            <!-- {{ currentResearch[magic].id }} -->
          </td>
          <td class="text-right">
            {{ readableNumber(currentResearch[magic]!.remainingCost) }}
          </td>
          <td class="text-right">
            {{ Math.ceil(currentResearch[magic]!.remainingCost / rp) }}
          </td>
        </tr>
      </tbody>
    </table>
    <section v-else>
      <p>You have completed researching all spells in your school of magic</p>
    </section>

    <section v-if="hasResearchRemaining" class="form" style="margin-top: 1rem">
      <label>Spend turns to research faster</label>
      <input type="number" v-model="turns" style="width: 6rem" />
      <div class="row" style="align-items: baseline">
        <input type="checkbox" v-model="focusResearch" style="width:15px; height: 15px" />
        <label>&nbsp;Research all spells of this magic</label>
      </div>

      <ActionButton 
        :proxy-fn="submitResearch"
        :label="'Research'" />

    </section>
    <div style="display: flex; align-items: center; margin-top: 10px; max-width: 25rem;">
      {{ researchResultStr }}
    </div>
    <div v-if="errorStr" class="error">{{ errorStr }}</div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import _ from 'lodash';
import magic from '@/components/magic.vue';
import ActionButton from '@/components/action-button.vue';
import { API, APIWrapper } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { getSpellById } from 'engine/src/base/references';
import { itemGenerationRate, maxSpellLevel, researchPoints } from 'engine/src/magic';
import { Mage } from '../../../shared/types/mage';
import { readableNumber, readableStr } from '@/util/util';
import { currentSpellLevel } from 'engine/src/base/mage';
import { allowedMagicList } from 'shared/src/common';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();

const rp = computed(() => {
  return researchPoints(mageStore.mage as Mage);
});

const itemRate = computed(() => {
  return (100 * itemGenerationRate(mageStore.mage as Mage)).toFixed(2);
});

const currentResearch = ref(mageStore.mage!.currentResearch);
const hasResearchRemaining = computed(() => {
  return Object.keys(currentResearch.value).reduce((acc, key) => {
    return acc + currentResearch.value[key] ? 1 : 0;
  }, 0);
});

const focusResearch = ref(mageStore.mage!.focusResearch? true : false);
const turns = ref(0);

const errorStr = ref('');

const spellName = (id: string) => {
  return getSpellById(id).name;
};

interface ResearchResult {
  [key: string]: string[]
}

const activeResearch = computed(() => {
  if (_.isEmpty(currentResearch)) return null;

  const r = Object.values(currentResearch.value).find(d => d?.active === true);
  if (!r) return null;
  return r;
});

const researchResult = ref<ResearchResult|null>(null);
const researchResultStr = computed(() => {
  const newSpells: string[] = [];
  if (researchResult.value === null) return '';

  const completed = Object.values(researchResult.value).some(list => list.length > 0);

  if (activeResearch.value && completed === false) {
    return `You spent ${turns.value} turn researching ${readableStr(activeResearch.value?.id)}`;
  }

  Object.keys(researchResult.value).forEach(key => {
    researchResult.value![key].forEach(spellId => {
      newSpells.push(readableStr(spellId));
    });
  });
  return `You added ${newSpells.join(', ')} to your spellbook`;
});

const filteredMagicTypes = computed(() => {
  return allowedMagicList.filter(m => {
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


  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    researchResult.value = null;
    return API.post('research', {
      magic,
      focus: focusResearch.value,
      turns: turns.value
    });
  })

  if (error) {
    errorStr.value = error;
    return;
  }

  if (data) {
    researchResult.value = data.result; 
    mageStore.setMage(data.mage as Mage);
    currentResearch.value = mageStore.mage?.currentResearch!;
    focusResearch.value = mageStore.mage?.focusResearch as boolean;
  }
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
