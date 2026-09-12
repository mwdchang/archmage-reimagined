<template>
  <main class="mb-2">
    <h1 class="mb-4"> Archmage Reimagined <small>alpha</small></h1>
    <p class="max-w-[50rem] leading-[1.25] mb-4">
      Archmage Reimagined is a reimagination of the classica MMORPG Archmage. With new features and twists designed to be exciting for a modern audience.
    </p>

    <p class="max-w-[50rem] mb-4">
      You play as a mage from one of the Five schools of magic:
      <span class="text-[#eeeeee]">Ascendant</span>, 
      <span class="text-[#00ffbb]">Verdant</span>, 
      <span class="text-[#ff2222]">Eradication</span>, 
      <span class="text-[#aaaaaa]">Nether</span>, and 
      <span class="text-[#00bbff]">Phantasm</span>. 
      Through trials and tribulations, you ultimate goal is the total domination of Terra.
    </p>

    <p class="max-w-[50rem] mb-4">
      To get started see the <a href="/guide">starter's guide</a> here.
    </p>

    <section class="mb-4">
      <p v-if="!loginUser">
        <Login @register="mode = 'registerMode'"/>
      </p>
      <p v-else class="text-[1.25rem]">
        Welcome back {{ loginUser }}
      </p>
    </section>

    <div v-if="clock && gameTable && loginUser" class="form mb-8 ml-12 w-[28rem] max-w-full"> 
      <h3 class="section-header"> Testing Server </h3>
      <p class="mb-4">
        The reset started on <span class="special-text">{{ readableDate(clock.startTime) }} </span> 
        and will end on <span class="special-text">{{ readableDate(approxEndTime) }} </span>.
      </p>


      <section v-if="mageStore.mage">
        <table class="mb-4">
          <tbody>
            <tr>
              <td>Rank</td>
              <td>Mage</td>
              <td>Forts</td>
              <td>Land</td>
              <td>Power</td>
            </tr>
            <tr>
              <td>
                {{ mageStore.mage.rank }}
              </td>
              <td>
                <div class="flex flex-row items-center gap-[5px]">
                  <Magic :magic="mageStore.mage.magic" small />
                  <div>{{ mageStore.mage.name }} (#{{mageStore.mage.id}})</div>
                </div>
              </td>
              <td>
                <div>{{ mageStore.mage.forts }} </div>
              </td>
              <td>
                <div>{{ readableNumber(totalLand(mageStore.mage)) }} </div>
              </td>
              <td>
                <div>{{ readableNumber(totalNetPower(mageStore.mage)) }} </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button @click="enterTerra" class="inline-block py-[0.3rem] px-[0.6rem] bg-[#4a90e2] hover:bg-[#2c639a] text-white border-none rounded cursor-pointer transition-colors duration-300">Enter Terra</button>
      </section>
      <section v-else>
        You do not have a mage on this server<br> <button @click="creatingMage = true" class="inline-block py-[0.3rem] px-[0.6rem] bg-[#4a90e2] hover:bg-[#2c639a] text-white border-none rounded cursor-pointer transition-colors duration-300">Create mage</button>
      </section>
    </div>

    <section v-if="loginUser">
      <div @click="logout" class="max-w-[4rem] text-[0.85rem] cursor-pointer hover:text-[#e40]">
        Sign out
      </div>
    </section>

    <div v-if="mode === 'registerMode'" class="fixed inset-0 bg-[#505050]/70 flex items-center justify-center z-[1000]" @click.self="mode = 'loginMode'">
      <div class="bg-[#888888] p-4 rounded-lg max-w-[40rem] w-[90%]">
        <Register @close="mode = 'loginMode'" />
      </div>
    </div>

    <div v-if="creatingMage === true" class="fixed inset-0 bg-[#505050]/70 flex items-center justify-center z-[1000]" @click.self="creatingMage = false">
      <div class="bg-[#888888] p-4 rounded-lg max-w-[40rem] w-[90%]">
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
import { readableDate, readableNumber } from '@/util/util';
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
