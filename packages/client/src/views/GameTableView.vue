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
import { ServerClock } from 'shared/types/common';
import { readableNumber, readableDate } from '@/util/util';

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
