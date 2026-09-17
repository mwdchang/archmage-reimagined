<template>
  <main>
    <div class="section-header mb-2">Server configurations</div>
    <section class="flex flex-col justify-center gap-[5px] max-w-[35rem]">
      <table v-if="gameTable" class="min-w-[20rem] mb-2">
        <tbody>
          <tr>
            <td>Exploration limit</td>
            <td>{{ readableNumber(gameTable.explorationLimit) }} acres</td>
          </tr>
          <tr>
            <td>Max turn storage</td>
            <td>{{ readableNumber(gameTable.maxTurns) }} turns</td>
          </tr>
          <tr>
            <td>Turn rate</td>
            <td>{{ gameTable.turnRate }} seconds</td>
          </tr>
          <tr>
            <td>Appretience duration</td>
            <td>{{ gameTable.apprenticeTurn }} turns</td>
          </tr>
          <tr>
            <td>Max item generation</td>
            <td>{{ readableNumber(100 * gameTable.itemGenerationRate) }}%</td>
          </tr>
          <tr>
            <td>Attack range</td>
            <td>
              {{ 100 * gameTable.war.range.min }}% to 
              {{ 100 * gameTable.war.range.max }}%
            </td>
          </tr>
          <tr>
            <td>Damaged status</td>
            <td>{{ 100 * gameTable.war.damagedPercentage }}%</td>
          </tr>
          <tr>
            <td>Attack cycle</td>
            <td>{{ gameTable.war.window }} hours </td>
          </tr>
          <tr>
            <td>Research point</td>
            <td>{{ readableNumber(productionTable.research) }} /node</td>
          </tr>
          <tr>
            <td>Mana storage</td>
            <td>{{ readableNumber(productionTable.manaStorage) }} / node</td>
          </tr>
          <tr>
            <td>Food production</td>
            <td>
              <div v-for="foodP of foodProduction">{{ foodP }} </div>
            </td>
          </tr>
          <tr>
            <td>Space</td>
            <td> 
              <div v-for="spaceP of spaceProduction">{{ spaceP }} </div>
            </td>
          </tr>
        </tbody>
      </table>

      <section class="grid min-w-[20rem] grid-cols-[1fr_2fr] gap-2" v-if="clock">
        <div class="text-center">
          <img src="@/assets/images/hourglass.png" class="h-[12rem]" />
        </div>
        <div class="text-center flex flex-col justify-center text-[1.10rem] leading-[125%]"> 
          <p>Current server turn is {{ readableNumber(clock.currentTurn) }}.</p>
          <p>Terra will be destroyed on turn {{ readableNumber(clock.endTurn) }} 
          ({{ readableDate(approxEndTime) }}).</p>
        </div>
      </section>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { API } from '@/api/api';
import { productionTable } from 'engine/src/base/config';
import { ServerClock, GameTable } from 'shared/src/common';
import { readableNumber, readableDate, readableStr } from '@/util/util';
import { buildingTypes } from 'engine/src/interior';

const gameTable = ref<GameTable| null>(null);
const clock = ref<ServerClock | null>(null);

const approxEndTime = computed(() => {
  if (!clock.value || !gameTable.value) return 0;

  const currentTime = clock.value.currentTurnTime;
  const rate = gameTable.value.turnRate;
  const remainingTurns = clock.value.endTurn - clock.value.currentTurn;

  const finalTime = currentTime + (rate * remainingTurns * 1000);
  return finalTime;
});

const foodProduction = computed(() => {
  const results: string[] = [];
  buildingTypes.forEach(b => {
    if (b.id in productionTable.food) {
      results.push(`${readableStr(b.id)} = ${readableNumber(productionTable.food[b.id])}`);
    }
  });
  return results;
});

const spaceProduction = computed(() => {
  const results: string[] = [];
  buildingTypes.forEach(b => {
    if (b.id in productionTable.space) {
      results.push(`${readableStr(b.id)} = ${readableNumber(productionTable.space[b.id])}`);
    }
  });
  return results;
});


onMounted(async () => {
  clock.value = (await API.get<ServerClock>('server-clock')).data;
  gameTable.value = (await API.get<GameTable>('/game-table')).data;
});
</script>
