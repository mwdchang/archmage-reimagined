<template>
  <main style="display: flex; flex-direction: column; align-items: center">
    <header-info v-if="mageStore.mage && !hideHeader.includes(route.name as string)" />
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMageStore } from './stores/mage';
import { RouterView, useRouter, useRoute } from 'vue-router';
import HeaderInfo from './components/header-info.vue';
import { API } from './api/api';
import { 
  loadUnitData,
  loadSpellData, 
  initializeResearchTree 
} from 'engine/src/base/references';

import plainUnits from 'data/src/units/plain-units.json';
import ascendantUnits from 'data/src/units/ascendant-units.json';
import verdantUnits from 'data/src/units/verdant-units.json';
import eradicationUnits from 'data/src/units/eradication-units.json';
import netherUnits from 'data/src/units/nether-units.json';
import phantasmUnits from 'data/src/units/phantasm-units.json';


import ascendantSpells from 'data/src/spells/ascendant-spells.json';
import verdantSpells from 'data/src/spells/verdant-spells.json';
import eradicationSpells from 'data/src/spells/eradication-spells.json';
import netherSpells from 'data/src/spells/nether-spells.json';
import phantasmSpells from 'data/src/spells/phantasm-spells.json';

const mageStore = useMageStore();
const router = useRouter();
const route = useRoute();

const hideHeader = ['status', 'test'];

// Test to see if session already exist
onMounted(async () => {

  // const plainUnits = (await import('../../data/plain-units.json')).default; 
  // console.log('!!!', import.meta.env);
  // const plainUnits = (await import(import.meta.env.VITE_UNITS_FILE)).default; 
  // console.log('!!', plainUnits);

  loadUnitData(plainUnits);
  loadUnitData(ascendantUnits);
  loadUnitData(verdantUnits);
  loadUnitData(eradicationUnits);
  loadUnitData(netherUnits);
  loadUnitData(phantasmUnits);

  loadSpellData(ascendantSpells);
  loadSpellData(verdantSpells);
  loadSpellData(eradicationSpells);
  loadSpellData(netherSpells);
  loadSpellData(phantasmSpells);
  initializeResearchTree();

  try {
    const r = await API.get('mage');
    mageStore.setLoginStatus(1);
    mageStore.setMage(r.data.mage);

    if (route.name === 'home') {
      router.push({ name: 'about' });
    }
  } catch (e: any) {
    if (e.response.status === 403 || e.response.status === 401) {
      mageStore.setLoginStatus(0);
      router.push({ name: 'home' });
    }
  }
});

</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
