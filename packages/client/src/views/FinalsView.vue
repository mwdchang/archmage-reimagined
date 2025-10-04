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
    <p> 
      Terra has been obliterated, these are the mages who have gained their place in the Hall of Immmortality
    </p>
  </section>
</template>

<script lang="ts" setup>
import { API } from '@/api/api';
import { onMounted, ref } from 'vue';
import { ServerClock } from 'shared/types/common';

const resetEnded = ref(false);
const serverClock = ref<ServerClock>();

onMounted(async () => {
  const clock = (await API.get<ServerClock>('server-clock')).data;

  if (clock.currentTurn >= clock.endTurn) {
    resetEnded.value = true;
  }
  serverClock.value = clock;
});

</script>
