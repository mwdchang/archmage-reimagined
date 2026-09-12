<template>
  <main v-if="mageStore.mage" class="min-h-screen flex flex-col items-center">
    <h3> 
      <router-link to="/manage"> 
        {{ mageStore.mage.name }} (# {{ mageStore.mage.id }}) 
        <sup class="animate-pulse text-[#f80]"
          v-if="unreadMails > 0">
          {{ unreadMails }} <svg-icon :name="'message'" />
        </sup>
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
    <section class="flex flex-row items-center gap-[25px] mb-4">
      <section>
        <img class="w-40" :src="sigilPath" />
      </section>
      <section class="flex-1"> 
        <div class="flex flex-row justify-between w-[20rem]">
          <div> Land </div>
          <div class="flex flex-row items-center gap-[5px]">
            {{ readableNumber(totalLand(mageStore.mage)) }} 
            <svg-icon :name="'land'" size="1.0rem" />
          </div>
        </div>
        <div class="flex flex-row justify-between w-[20rem]">
          <div>Forts</div>
          <div class="flex flex-row items-center gap-[5px]">
            {{ mageStore.mage.forts }} 
            <svg-icon :name="'fort'" size="1.0rem" />
          </div>
        </div>
        <div class="flex flex-row justify-between w-[20rem]">
          <div>Geld</div>
          <div class="flex flex-row items-center gap-[5px]">
            {{ readableNumber(mageStore.mage.currentGeld) }} 
            <svg-icon :name="'geld'" size="1.0rem" />
          </div>
        </div>
        <div class="flex flex-row justify-between w-[20rem]">
          <div>Population</div>
          <div class="flex flex-row items-center gap-[5px]">
            {{ readableNumber(mageStore.mage.currentPopulation) }} / {{ readableNumber(interior.maxPopulation(mageStore.mage)) }}
            <svg-icon :name="'population'" size="1.0rem" />
          </div>
        </div>

        <div class="flex flex-row justify-between w-[20rem]">
          <div>Magic</div>
          <div class="flex flex-row items-center gap-[5px]">
            {{ readableNumber(mageStore.mage.currentMana) }} / {{ readableNumber(manaStorage(mageStore.mage)) }}
            <svg-icon :name="'mana'" size="1.0rem" />
          </div>
        </div>
        <div class="flex flex-row justify-between w-[20rem]">
          <div>Spell Power</div>
          <div>{{ spellLevel }} / {{ maxSpellLevel(mageStore.mage) }} </div>
        </div>
        <div class="flex flex-row justify-between w-[20rem]">
          <div>Items</div>
          <div>{{ numItems }}</div>
        </div>
        <div class="flex flex-row justify-between w-[20rem]">
          <div>Units</div>
          <div>{{ readableNumber(numArmy) }}</div>
        </div>

      </section>
    </section>


    <section class="grid grid-cols-5 gap-2">
      <!-- col 1-->
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-1 row-start-1" to="/explore">Explore</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-1 row-start-2" to="/build">Build</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-1 row-start-3 text-[#d80]" to="/destroy">Destroy</router-link>

      <!-- col 2-->
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-2 row-start-1" to="/spell">Cast Magic</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-2 row-start-2" to="/item">Use Item</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-2 row-start-3" to="/research">Research</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-2 row-start-4 text-[#d80]" to="/dispel">Dispel Magic</router-link>

      <!-- col 3-->
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-3 row-start-1" to="/status">Status Report</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-3 row-start-2" to="/rankList">Rankings</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-3 row-start-3" to="/charge">Mana Charge</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-3 row-start-4" to="/geld">Gelding</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-3 row-start-5" to="/market">Market</router-link>

      <!-- col 4-->
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-4 row-start-1" to="/battle">Battle</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-4 row-start-2" to="/assignment">Assignment</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-4 row-start-3" to="/chronicles">Chronicles</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-4 row-start-4" to="/recruit">Recruit</router-link>
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-4 row-start-5 text-[#d80]" to="/disband">Disband</router-link>


      <!-- col 5-->
      <router-link class="text-center bg-[#212120] py-2 px-3 rounded hover:brightness-125 transition-[filter] duration-400 col-start-5 row-start-1" to="/skills">Skills</router-link>
    </section>

    <section class="flex flex-row items-center gap-[30px] mt-5 mb-4 p-2 bg-[#181818] rounded-[3px]">
      <router-link to="/encyclopedia/spell">Encyclopedia</router-link>
      <router-link to="/guide">Guide</router-link>
      <router-link to="/analysis">Analysis</router-link>
    </section>

    <div>Trail of Deeds</div>
    <div class="flex flex-col max-w-[45rem] min-w-[30rem] max-h-[25rem] overflow-y-auto rounded-lg text-[0.9rem] leading-[1.2] p-6 m-2 bg-[#223] gap-4" v-if="logs.length > 0">
      <div v-for="(turn) in logs" :key="turn.turn">
        <div class="flex flex-row items-center gap-2"> 
          <span class="font-semibold">Turn {{turn.turn}}</span>
          <span class="font-light opacity-75">({{ readableDate(turn.timestamp) }})</span> 
        </div>
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
import { ChronicleTurn, GameTable, Mail } from 'shared/types/common';
import { readableNumber, readableDate } from '@/util/util';
import SvgIcon from '@/components/svg-icon.vue';

const mageStore = useMageStore();
const logs = ref<ChronicleTurn[]>([]);

const unreadMails = ref(0);

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


  const mail = (await API.get<{ mails: Mail[]}>('/mails')).data.mails;
  unreadMails.value = mail.filter(d => d.read === false).length;
});

</script>
