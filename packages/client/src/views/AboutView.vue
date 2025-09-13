<template>
  <main class="about" v-if="mageStore.mage">
    <h3>{{ mageStore.mage.name }} (# {{ mageStore.mage.id }})</h3>
    <div>Ranking {{ mageStore.mage.rank }}, Net power {{ readbleNumber(totalNetPower(mageStore.mage)) }} </div>
    <p>
      You have {{ readbleNumber(mageStore.mage.currentTurn) }} turns available,
      {{ readbleNumber(mageStore.mage.turnsUsed) }} turns used.
    </p>

    <br>
    <section class="row" style="gap: 30px">
      <section>
        <img style="width: 160px" v-if="mageStore.mage.magic === 'ascendant'" src="@/assets/images/ascendant-new.png" />
        <img style="width: 160px" v-if="mageStore.mage.magic === 'verdant'" src="@/assets/images/verdant-new.png" />
        <img style="width: 160px" v-if="mageStore.mage.magic === 'eradication'" src="@/assets/images/eradication-new.png" />
        <img style="width: 160px" v-if="mageStore.mage.magic === 'nether'" src="@/assets/images/nether-new.png" />
        <img style="width: 160px" v-if="mageStore.mage.magic === 'phantasm'" src="@/assets/images/phantasm-new.png" />
      </section>
      <section> 
        <div class="about-row">
          <div> Land </div>
          <div class="row">
            {{ readbleNumber(totalLand(mageStore.mage)) }} 
            <svg-icon :name="'land'" :size=16 />
          </div>
        </div>
        <div class="about-row">
          <div>Forts</div>
          <div class="row">
            {{ mageStore.mage.forts }} 
            <svg-icon :name="'fort'" :size=16 />
          </div>
        </div>
        <div class="about-row">
          <div>Geld</div>
          <div class="row">
            {{ readbleNumber(mageStore.mage.currentGeld) }} 
            <svg-icon :name="'geld'" :size=16 />
          </div>
        </div>
        <div class="about-row">
          <div>Population</div>
          <div class="row">
            {{ readbleNumber(mageStore.mage.currentPopulation) }} / {{ readbleNumber(interior.maxPopulation(mageStore.mage)) }}
            <svg-icon :name="'population'" :size=16 />
          </div>
        </div>

        <div class="about-row">
          <div>Magic</div>
          <div class="row">
            {{ readbleNumber(mageStore.mage.currentMana) }} / {{ readbleNumber(manaStorage(mageStore.mage)) }}
            <svg-icon :name="'mana'" :size=16 />
          </div>
        </div>
        <div class="about-row">
          <div>Spell Level</div>
          <div>{{ spellLevel }} / {{ maxSpellLevel(mageStore.mage) }} </div>
        </div>
        <div class="about-row">
          <div>Items</div>
          <div>{{ numItems }}</div>
        </div>
      </section>
    </section>

    <section class="row" style="gap: 35px; align-items: baseline">
      <div class="column"> 
        <router-link to="/explore">Explore</router-link>
        <router-link to="/build">Build</router-link>
        <router-link to="/destroy" style="color: #d40">Destroy</router-link>
      </div>

      <div class="column">
        <router-link to="/spell">Cast Magic</router-link>
        <router-link to="/item">Use Item</router-link>
        <router-link to="/research">Research</router-link>
        <router-link to="/dispel" style="color: #d40">Dispel Magic</router-link>
      </div>

      <div class="column">
        <router-link to="/status">Status Report</router-link>
        <router-link to="/rankList">Rankings</router-link>
        <router-link to="/charge">Mana Charge</router-link>
        <router-link to="/geld">Gelding</router-link>
        <div>Black market</div>
      </div>
      
      <div class="column">
        <router-link to="/battle">Battle</router-link>
        <router-link to="/assignment">Assignment</router-link>
        <router-link to="/chronicles">Chronicles</router-link>
        <router-link to="/recruit">Recruit</router-link>
        <router-link to="/disband" style="color: #d40">Disband</router-link>
      </div>
    </section>

    <section class="row" style="gap: 30px; margin-top: 20px; background: #181818; border-radius: 3px">
      <router-link to="/encyclopedia">Encyclopedia</router-link>
      <router-link to="/guide">Guide</router-link>
      <div>About</div>
    </section>
    <!--
    <router-link to="/status">Status Report</router-link>
    <router-link to="/battle">Battle</router-link>
    <router-link to="/rankList">Ranks</router-link>
    <router-link to="/chronicles">Chronicles</router-link>
    -->
    


    <div class="chronicles" v-if="logs.length > 0" style="max-height: 25rem; overflow-y: scroll">
      <div v-for="(turn) in logs" :key="turn.turn">
        <div>(Turn {{turn.turn}})</div>
        <div v-for="(log) in turn.data">
          {{ log }}
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
import { totalLand } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
import { totalNetPower, currentSpellLevel } from 'engine/src/base/mage';
import { maxSpellLevel } from 'engine/src/magic';
import { API } from '@/api/api';
import { ChronicleTurn } from 'shared/types/common';
import { readbleNumber } from '@/util/util';
import SvgIcon from '@/components/svg-icon.vue';

const mageStore = useMageStore();
const logs = ref<ChronicleTurn[]>([]);

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
  // console.log(logs.value);
});



</script>

<style scoped>
section {
  padding: 5px;
}

.chronicles {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 120%;
  padding: 25px;
  margin: 10px;
  background: #223;
  gap: 10px;
}

.about-row {
  display: flex;
  flex-direction: row;
  width: 15vw;
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
