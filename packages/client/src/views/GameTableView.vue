<template>
  <div class="section-header" style="margin-bottom: 0.5rem">Server configurations</div>
  <main class="column" style="max-width: 35rem">
    <table v-if="gameTable" style="min-width: 20rem; margin-bottom: 0.5rem">
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

    <section class="grid-container" v-if="clock">
      <div class="grid-item">
        <img src="@/assets/images/hourglass.png" style="height: 12rem" />
      </div>
      <div class="grid-item clock-display"> 
        <p>Current server turn is {{ readableNumber(clock.currentTurn) }}.</p>
        <p>Terra will be destroyed on turn {{ readableNumber(clock.endTurn) }} 
        ({{ readableDate(approxEndTime) }}).</p>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { API } from '@/api/api';
import { GameTable } from 'shared/types/common';
import { productionTable } from 'engine/src/base/config';
import { ServerClock } from 'shared/types/common';
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

<style scoped>
.grid-container {
  min-width: 20rem;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.5rem 0.5rem;
}

.grid-item {
  text-align: center;
}

.clock-display {
  display: flex; 
  flex-direction: column; 
  justify-content: center;
  font-size: 1.10rem;
  line-height: 125%;
}
</style>
