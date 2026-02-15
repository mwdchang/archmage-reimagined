<template>
  <main style="margin-bottom: 0.5rem">
    <h1 style="margin-bottom: 1rem"> Archmage Reimagined <small>alpha</small></h1>
    <p style="max-width: 50rem; line-height: 1.25; margin-bottom: 1rem">
      Archmage Reimagined is a reimagination of the classica MMORPG Archmage. With new features and twists designed to be exciting for a modern audience.
    </p>

    <p style="max-width: 50rem; margin-bottom: 1rem">
      You play as a mage from one of the Five schools of magic:
      <span style="color: #eeeeee">Ascendant</span>, 
      <span style="color: #00ffbb">Verdant</span>, 
      <span style="color: #ff2222">Eradication</span>, 
      <span style="color: #aaaaaa">Nether</span>, and 
      <span style="color: #00bbff">Phantasm</span>. 
      Through trials and tribulations, you ultimate goal is the total domination of Terra.
    </p>



    <!--
    <p style="margin-bottom: 2rem"> 
      <button @click="mode = 'registerMode'">Reincarnate Here</button> if you do not have a mage.
    </p>
    -->

    <p style="margin-bottom: 1rem">
      <Login @register="mode = 'registerMode'"/>
    </p>

    <div v-if="clock && gameTable" class="form" style="margin-bottom: 2rem; margin-left: 3rem; width: 28rem"> 
      <p> Current reset </p>
      <ul>
        <li> Starts: {{ readableDate(clock.startTime) }} </li>
        <li> Ends: {{ readableDate(approxEndTime) }} </li>
      </ul>
    </div>


    <div v-if="mode === 'registerMode'" class="modal-overlay" @click.self="mode = 'loginMode'">
      <div class="modal">
        <Register />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ServerClock } from 'shared/types/common';
import Register from '@/components/register.vue';
import Login from '@/components/login.vue';
import { API } from '@/api/api';
import { readableDate } from '@/util/util';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia';


const mode = ref<string>('loginMode');
const clock = ref<ServerClock>();
const mageStore = useMageStore();

const { gameTable } = storeToRefs(mageStore);

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
});

</script>

<style scoped>
button {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background-color: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #2c639a;
}


/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0; /* full screen */
  background-color: rgba(80, 80, 80, 0.7); /* dim background */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal box */
.modal {
  background: #888888;
  padding: 1.0rem;
  border-radius: 0.5rem;
  max-width: 40rem;
  width: 90%;
}
</style>
