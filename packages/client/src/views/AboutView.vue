<template>
  <main class="about" v-if="mageStore.mage">
    <h2>{{ mageStore.mage.name }} (# {{mageStore.mage.id}})</h2>
    <h4>Ranking {{ mageStore.mage.rank }}, Net power {{ totalNetPower(mageStore.mage) }} </h4>
    <br>
    <main style="display: flex; flex-direction: row">
      <section>
        <img v-if="mageStore.mage.magic==='ascendant'" src="@/assets/images/ascendant.jpeg" />
        <img v-if="mageStore.mage.magic==='verdant'" src="@/assets/images/verdant.jpeg" />
        <img v-if="mageStore.mage.magic==='eradication'" src="@/assets/images/eradication.jpeg" />
        <img v-if="mageStore.mage.magic==='nether'" src="@/assets/images/nether.jpeg" />
        <img v-if="mageStore.mage.magic==='phantasm'" src="@/assets/images/phantasm.jpeg" />
      </section>
      <section style="margin-left: 25px">
        <div class="row">
          <div>Land</div><div>{{ totalLand(mageStore.mage) }} </div>
        </div>
        <div class="row">
          <div>Forts</div><div>{{ mageStore.mage.forts }} </div>
        </div>
        <div class="row">
          <div>Geld</div><div>{{ mageStore.mage.currentGeld }} </div>
        </div>
        <div class="row">
          <div>Population</div><div>{{ mageStore.mage.currentPopulation}} / {{ interior.maxPopulation(mageStore.mage) }}</div>
        </div>

        <div class="row">
          <div>Magic</div><div>{{ mageStore.mage.currentMana}} / {{ manaStorage(mageStore.mage) }}</div>
        </div>
        <div class="row">
          <div>Spell Level</div><div>{{ spellLevel }} / {{ maxSpellLevel(mageStore.mage) }} </div>
        </div>
        <div class="row">
          <div>Items</div><div>{{ numItems }}</div>
        </div>
      </section>
    </main>

    <router-link to="/status">Status Report</router-link>
    <router-link to="/battle">Battle</router-link>
    <router-link to="/rankList">Ranks</router-link>
    <router-link to="/chronicles">Chronicles</router-link>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
import { totalNetPower } from 'engine/src/base/mage';
import { currentSpellLevel, maxSpellLevel } from 'engine/src/magic';

const mageStore = useMageStore();

const numItems = computed(() => {
  const keys = Object.keys(mageStore.mage!.items);
  let num = 0;
  keys.forEach(key => {
    num += mageStore.mage!.items[key];
  });
  return num;
});

const spellLevel = computed(() => {
  return currentSpellLevel(mageStore.mage!);
});
</script>

<style scoped>
section {
  padding: 5px;
}

.row {
  display: flex;
  flex-direction: row;
  width: 18vw;
  justify-content: space-between;
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
