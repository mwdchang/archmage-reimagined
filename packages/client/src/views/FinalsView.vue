<template>
  <section v-if="serverClock && resetEnded === false">
    <div class="row">
      <img src="@/assets/images/hourglass.png" style="height: 250px" />
    </div>
    <p>
      There are still time left in Terra ... 
      <br>
      Server turn {{ serverClock.currentTurn }} of {{ serverClock.endTurn }}
    </p>
  </section>
  <section v-if="serverClock && resetEnded === true">
    <h1> Terra is obliterated</h1>
    <p style="margin-bottom: 0.5rem"> 
     These are the mages who have gained their place in the Hall of Immmortality. The cycle will restart soon.
    </p>

    <table style="min-width: 30rem"> 
      <thead>
        <tr>
          <td>Rank</td>
          <td>Name</td>
          <td>&nbsp;</td>
          <td>Land</td>
          <td>Fort</td>
          <td>Power</td>
          <td>Status</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(rank) of rankList" :key="rank.id">
          <td class="text-right"> {{ rank.rank }} </td>
          <td> {{ rank.name }} (#{{ rank.id }}) </td>
          <td> <Magic :magic="rank.magic" small /> </td>
          <td class="text-right"> {{ readableNumber(rank.land) }} </td>
          <td class="text-right"> {{ rank.forts }} </td>
          <td class="text-right"> {{ readableNumber(rank.netPower) }} </td>
          <td>{{ rank.status }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts" setup>
import { API } from '@/api/api';
import { onMounted, ref } from 'vue';
import { MageRank, ServerClock } from 'shared/types/common';
import { readableNumber } from '@/util/util';
import Magic from '@/components/magic.vue';

const rankList = ref<MageRank[]>([]);

const resetEnded = ref(false);
const serverClock = ref<ServerClock>();

onMounted(async () => {
  const clock = (await API.get<ServerClock>('server-clock')).data;

  if (clock.currentTurn >= clock.endTurn) {
    resetEnded.value = true;
  }
  serverClock.value = clock;

  if (resetEnded.value === true) {
    rankList.value = (await API.get('ranklist')).data.rankList;
  }
});

</script>
