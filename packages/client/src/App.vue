<template>
  <main style="display: flex; flex-direction: column; align-items: center">
    <header-info v-if="mage && !hideHeader.includes(route.name as string)" />
    <nav-bar v-if="mage && !publicRoutes.includes(route.name as string)" />

    <RouterView v-if="publicRoutes.includes(route.name as string)" /> 
    <RouterView v-if="!publicRoutes.includes(route.name as string) && mageStore.mage" /> 

    <Footer />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMageStore } from './stores/mage';
import { RouterView, useRouter, useRoute } from 'vue-router';
import HeaderInfo from './components/header-info.vue';
import Footer from './components/footer.vue';
import NavBar from './components/nav.vue';
import { storeToRefs } from 'pinia'
import { API } from './api/api';
import { 
  loadUnitData,
  loadSpellData, 
  loadItemData,
  initializeResearchTree 
} from 'engine/src/base/references';
import { ServerClock } from 'shared/types/common';

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

import lesserItems from 'data/src/items/lesser.json';

const mageStore = useMageStore();
const router = useRouter();
const route = useRoute();
const { mage } = storeToRefs(mageStore);


const publicRoutes = [
  'home', 'guide', 'encyclopedia',
  'viewUnit', 'viewSpell', 'finals',
  'analysis'
];
const hideHeader = [
  'status',
  'test',
  'about',
  'viewItem',
  'viewUnit',
  'viewSpell',
  'encyclopedia',
  'guide',
  'analysis',
  'notFound'
];

// Test to see if session already exist
onMounted(async () => {
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

  loadItemData(lesserItems);

  const clock = (await API.get<ServerClock>('server-clock')).data;
  if (clock.currentTurn >= clock.endTurn) {
    router.push({ name: 'finals' });
    return;
  }

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
      if (publicRoutes.includes(route.name as string)) {
        return
      }
      router.push({ name: 'home' });
    }
  }
});

</script>

<style scoped>
</style>
