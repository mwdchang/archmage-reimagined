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
import { onMounted, watch } from 'vue';
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
import uniqueItems from 'data/src/items/unique.json';

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

watch(
  () => route.meta.background,
  (bg) => {
    document.body.dataset.bg = (bg as string) || 'default'
  },
  { immediate: true }
)

// Test to see if session already exist
onMounted(async () => {

  document.addEventListener("focusin", (e) => {
    const el = e.target;
    
    // Ensure el is an HTMLInputElement
    if (el instanceof HTMLInputElement && el.type === "number") {
      // Place cursor at the end after browser default
      setTimeout(() => {
        el.select();
        // cursor at the end
        // el.selectionStart = el.selectionEnd = el.value.length;
      }, 0);
    }
  });

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
  loadItemData(uniqueItems);

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
/*
:global(body) {
  display: block;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.9)),
    url('@/assets/images/splash.png');
  background-size: contain;
  background-position: center 2rem;
  background-repeat: no-repeat;
  height: 90vh;
  font-size: 1.0rem;
}


:global(body[data-bg="default"]) {
  background-image: none;
  height: 0;
}
*/


:global(body[data-bg="splash"]) {
  display: block;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.9)),
    url('@/assets/images/splash.png');
  background-size: contain;
  background-position: center 2rem;
  background-repeat: no-repeat;
  height: 90vh;
  font-size: 1.0rem;
}
</style>
