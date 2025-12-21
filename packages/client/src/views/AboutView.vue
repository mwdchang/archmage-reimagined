<template>
  <main class="about" v-if="mageStore.mage">
    <h3>
      <router-link to="/manage" class="row" style="align-items: center">
        {{ mageStore.mage.name }} (# {{ mageStore.mage.id }})
      </router-link>
    </h3>
    <div>Ranking {{ mageStore.mage.rank }}, Net power {{ readableNumber(totalNetPower(mageStore.mage)) }} </div>
    <p v-if="gameTable">
      {{ readableNumber(mageStore.mage.currentTurn) }} /
      {{ readableNumber(gameTable.maxTurns) }} turns available,
      {{ readableNumber(mageStore.mage.turnsUsed) }} turns used. 
    </p>
    <p v-if="gameTable">
      <router-link to="/game-table">
        Additional turn every {{ (gameTable.turnRate / 60).toFixed(1) }} minutes.
      </router-link>
    </p>

    <br>
    <section class="row" style="gap: 25px; margin-bottom: 1rem">
      <section>
        <img style="width: 10rem" :src="sigilPath" />
      </section>
      <section style="flex: 1"> 
        <div class="about-row">
          <div> Land </div>
          <div class="row">
            {{ readableNumber(totalLand(mageStore.mage)) }} 
            <svg-icon :name="'land'" size="1.0rem" />
          </div>
        </div>
        <div class="about-row">
          <div>Forts</div>
          <div class="row">
            {{ mageStore.mage.forts }} 
            <svg-icon :name="'fort'" size="1.0rem" />
          </div>
        </div>
        <div class="about-row">
          <div>Geld</div>
          <div class="row">
            {{ readableNumber(mageStore.mage.currentGeld) }} 
            <svg-icon :name="'geld'" size="1.0rem" />
          </div>
        </div>
        <div class="about-row">
          <div>Population</div>
          <div class="row">
            {{ readableNumber(mageStore.mage.currentPopulation) }} / {{ readableNumber(interior.maxPopulation(mageStore.mage)) }}
            <svg-icon :name="'population'" size="1.0rem" />
          </div>
        </div>

        <div class="about-row">
          <div>Magic</div>
          <div class="row">
            {{ readableNumber(mageStore.mage.currentMana) }} / {{ readableNumber(manaStorage(mageStore.mage)) }}
            <svg-icon :name="'mana'" size="1.0rem" />
          </div>
        </div>
        <div class="about-row">
          <div>Spell Power</div>
          <div>{{ spellLevel }} / {{ maxSpellLevel(mageStore.mage) }} </div>
        </div>
        <div class="about-row">
          <div>Items</div>
          <div>{{ numItems }}</div>
        </div>
        <div class="about-row">
          <div>Units</div>
          <div>{{ readableNumber(numArmy) }}</div>
        </div>

      </section>
    </section>


    <section class="grid-container">
      <!-- col 1-->
      <router-link class="grid-item g-c1 g-r1" to="/explore">Explore</router-link>
      <router-link class="grid-item g-c1 g-r2" to="/build">Build</router-link>
      <router-link class="grid-item g-c1 g-r3" to="/destroy" style="color: #d80">Destroy</router-link>

      <!-- col 2-->
      <router-link class="grid-item g-c2 g-r1" to="/spell">Cast Magic</router-link>
      <router-link class="grid-item g-c2 g-r2" to="/item">Use Item</router-link>
      <router-link class="grid-item g-c2 g-r3" to="/research">Research</router-link>
      <router-link class="grid-item g-c2 g-r4" to="/dispel" style="color: #d80">Dispel Magic</router-link>

      <!-- col 3-->
      <router-link class="grid-item g-c3 g-r1" to="/status">Status Report</router-link>
      <router-link class="grid-item g-c3 g-r2" to="/rankList">Rankings</router-link>
      <router-link class="grid-item g-c3 g-r3" to="/charge">Mana Charge</router-link>
      <router-link class="grid-item g-c3 g-r4" to="/geld">Gelding</router-link>
      <router-link class="grid-item g-c3 g-r5" to="/market">Market</router-link>

      <!-- col 4-->
      <router-link class="grid-item g-c4 g-r1" to="/battle">Battle</router-link>
      <router-link class="grid-item g-c4 g-r2" to="/assignment">Assignment</router-link>
      <router-link class="grid-item g-c4 g-r3" to="/chronicles">Chronicles</router-link>
      <router-link class="grid-item g-c4 g-r4" to="/recruit">Recruit</router-link>
      <router-link class="grid-item g-c4 g-r5" to="/disband" style="color: #d80">Disband</router-link>
    </section>

    <section class="row" style="gap: 30px; margin-top: 20px; background: #181818; border-radius: 3px">
      <router-link to="/encyclopedia/spell">Encyclopedia</router-link>
      <router-link to="/guide">Guide</router-link>
      <router-link to="/analysis">Analysis</router-link>
    </section>

    <div class="chronicles" v-if="logs.length > 0">
      <div v-for="(turn) in logs" :key="turn.turn">
        <div style="font-weight: 600">Turn {{turn.turn}}: </div>
        <div v-for="(log) in turn.data">
          <div v-if="log.type === 'battleLog'">
            <router-link :to="{ name: 'battleResult', params: { id: log.id }}"> 
              {{ log.message }} 
            </router-link>
          </div>
          <div v-else>
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
import { totalLand, totalUnits } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
import { totalNetPower, currentSpellLevel } from 'engine/src/base/mage';
import { maxSpellLevel } from 'engine/src/magic';
import { API } from '@/api/api';
import { ChronicleTurn, GameTable } from 'shared/types/common';
import { readableNumber } from '@/util/util';
import SvgIcon from '@/components/svg-icon.vue';

const mageStore = useMageStore();
const logs = ref<ChronicleTurn[]>([]);

const gameTable = ref<GameTable | null>(null);

const sigilPath = computed(() => {
  return (new URL(`../assets/images/${mageStore.mage!.magic}-new.png`, import.meta.url)).href
});

const numArmy = computed(() => {
  return totalUnits(mageStore.mage!);
});

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

onMounted(async () => {
  const res = await API.get<{ chronicles: ChronicleTurn[]}>('/chronicles');
  logs.value = res.data.chronicles;

  gameTable.value = (await API.get<GameTable>('/game-table')).data;
});

</script>

<style scoped>

.chronicles {
  display: flex;
  max-width: 45rem;
  min-width: 30rem;
  max-height: 25rem;
  overflow-y: scroll;
  border-radius: 0.5rem;

  flex-direction: column;
  font-size: 0.9rem;
  line-height: 120%;
  padding: 1.5rem;
  margin: 0.5rem;
  background: #223;
  gap: 1.0rem;
}

.about-row {
  display: flex;
  flex-direction: row;
  width: 20rem;
  justify-content: space-between;
}

.about {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 equal columns */
  gap: 0.6rem 1.25rem; /* Optional spacing between columns */
}

.grid-item {
  /* background-color: #8bc34a; */
  background-color: #212120;
  padding: 0.45rem 1rem;
  /* color: white; */
  text-align: center;
  border-radius: 0.25rem;
  /* transition: background-color 0.3s ease;  */
  transition: filter 0.4s ease;
}


.grid-item:hover {
  filter: brightness(1.2);
}

.unread-badge {
  /*
  width: 12px;
  height: 12px;
  background-color: red;
  border-radius: 50%;
  */
  animation: pulse 1.5s infinite;
  top: 5px;
  right: 5px;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

/*
.unread-badge {
  box-shadow: 0 0 0px red;
  animation: glow 1.5s infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 0px red; }
  50% { box-shadow: 0 0 8px red; }
}
*/
</style>
