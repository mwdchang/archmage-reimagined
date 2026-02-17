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

    <p style="max-width: 50rem; margin-bottom: 1rem">
      To get started see the <a href="/guide">starter's guide</a> here.
    </p>

    <section style="margin-bottom: 1rem">
      <p v-if="!loginUser">
        <Login @register="mode = 'registerMode'"/>
      </p>
      <p v-else style="font-size: 1.25rem">
        Welcome back {{ loginUser }}
      </p>
    </section>

    <div v-if="clock && gameTable && loginUser" class="form" style="margin-bottom: 2rem; margin-left: 3rem; width: 28rem"> 
      <h3 class="section-header"> Testing Server </h3>
      <p style="margin-bottom: 1rem">
        The reset started on <span class="special-text">{{ readableDate(clock.startTime) }} </span> 
        and will end on <span class="special-text">{{ readableDate(approxEndTime) }} </span>.
      </p>


      <section v-if="mageStore.mage">
        <table style="margin-bottom: 1rem">
          <tbody>
            <tr>
              <td>Mage</td>
              <td>Forts</td>
              <td>Land</td>
              <td>Power</td>
            </tr>
            <tr>
              <td>
                <div class="row">
                  <Magic :magic="mageStore.mage.magic" small />
                  <div>{{ mageStore.mage.name }} (#{{mageStore.mage.id}})</div>
                </div>
              </td>
              <td>
                <div>{{ mageStore.mage.forts }} </div>
              </td>
              <td>
                <div>{{ totalLand(mageStore.mage) }} </div>
              </td>
              <td>
                <div>{{ totalNetPower(mageStore.mage) }} </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button @click="enterTerra">Enter Terra</button>
      </section>
      <section v-else>
        You do not have a mage on this server<br> <button @click="creatingMage = true">Create mage</button>
      </section>
    </div>

    <section v-if="loginUser">
      <div @click="logout" class="logout">
        Sign out
      </div>
    </section>

    <div v-if="mode === 'registerMode'" class="modal-overlay" @click.self="mode = 'loginMode'">
      <div class="modal">
        <Register @close="mode = 'loginMode'" />
      </div>
    </div>

    <div v-if="creatingMage === true" class="modal-overlay" @click.self="creatingMage = false">
      <div class="modal">
        <CreateMage />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ServerClock } from 'shared/types/common';
import Register from '@/components/register.vue';
import Login from '@/components/login.vue';
import CreateMage from '@/components/create-mage.vue';
import Magic from '@/components/magic.vue';
import { API } from '@/api/api';
import { readableDate } from '@/util/util';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia';
import { totalLand, totalNetPower } from 'engine/src/base/mage';
import { useRouter } from 'vue-router';

const router = useRouter();

const mode = ref<string>('loginMode');
const creatingMage = ref(false);
const clock = ref<ServerClock>();
const mageStore = useMageStore();


const { gameTable, loginUser } = storeToRefs(mageStore);

const approxEndTime = computed(() => {
  if (!clock.value || !gameTable.value) return 0;

  const currentTime = clock.value.currentTurnTime;
  const rate = gameTable.value.turnRate;
  const remainingTurns = clock.value.endTurn - clock.value.currentTurn;

  const finalTime = currentTime + (rate * remainingTurns * 1000);
  return finalTime;
});

const logout = async () => {
  await API.post('/logout');
  mageStore.setLoginUser('');
  mageStore.setMage(null)
};

const enterTerra = () => {
  setTimeout(() => {
    router.push({ name: 'about' });
  }, 400);
};

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

.logout {
  max-width: 4rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.logout:hover {
  color: #e40;
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
