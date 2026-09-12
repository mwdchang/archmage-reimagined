<template>
  <main class="w-full">
    <section class="form w-full max-w-full"> 
      <div>
        <h2 class="mb-4">Create mage</h2>
        <div class="flex flex-row items-baseline gap-[10px] max-w-[25rem] py-1">
          <span class="w-20 shrink-0">Name</span> 
          <input @keyup.enter="register" name="username" type="text"
            v-model="registerData.mageName">
        </div>

        <div class="flex flex-row items-baseline gap-[10px] max-w-[25rem] py-1">
          <span class="w-20 shrink-0">Magic 
          </span>
          <select v-model="registerData.magic">
            <option value="ascendant">Ascendant</option>
            <option value="verdant">Verdant</option>
            <option value="eradication">Eradication</option>
            <option value="nether">Nether</option>
            <option value="phantasm">Phantasm</option>
          </select>
        </div>
      </div>

      <h2 class="flex flex-row items-center gap-[5px] my-2">
        <magic :magic="registerData.magic" />  {{ readableStr(registerData.magic) }}
      </h2>
      <div class="flex flex-row items-center gap-5">
        <section class="ml-4 shrink-0">
          <img class="h-[150px] object-contain" v-show="registerData.magic === 'ascendant'" src="@/assets/images/ascendant-new.png" />
          <img class="h-[150px] object-contain" v-show="registerData.magic === 'verdant'" src="@/assets/images/verdant-new.png" />
          <img class="h-[150px] object-contain" v-show="registerData.magic === 'eradication'" src="@/assets/images/eradication-new.png" />
          <img class="h-[150px] object-contain" v-show="registerData.magic === 'nether'" src="@/assets/images/nether-new.png" />
          <img class="h-[150px] object-contain" v-show="registerData.magic === 'phantasm'" src="@/assets/images/phantasm-new.png" />
        </section>

        <section class="max-w-[90vw] lg:max-w-[50vw] leading-[1.35rem]">
          <p v-show="registerData.magic === 'ascendant'">
            The guiding principle of Ascendant magic is one based on piety.
            Focussing on magic that heals rather than harms, Ascendant mages are fearsome
            opponents nonetheless as their troops can resurrect even after being struck down.
            They detest the destructiveness of Eradication and Nether mages.
          </p>
          <p v-show="registerData.magic === 'verdant'">
            Verdant magic uses the call of the wild to summon the wrath of Terra against the other
            forms of sorcery. Using the instinctive rage of every living creature, Verdant mages
            prove that the survival of the fittest is the only universal law.
            Their style of magic is opposed by Phantasm and Nether.
          </p>
          <p v-show="registerData.magic === 'eradication'">
            Eradication magic is the most chaotic of the five types of magic, using devastating
            spells to beat enemies within an inch of their lives...then burning them the rest of the way.
            Eradication mages are generally the most militaristic, warring against their enemies,
            the comparatively peaceful Ascendant and Phantasm counter-parts.
          </p>
          <p v-show="registerData.magic === 'nether'">
            Nether mages are often the most despised of Archmagi as they depend on the weakness of
            their enemies rather than their own strength to achieve victory. Preferring corruption
            over creation, Nether magic focuses on crippling opponents gradually.
            Their practices disgust Ascendant and Verdant mages.
          </p>
          <p v-show="registerData.magic === 'phantasm'">
            Teaching that strength lies in transience, Phantasm mages do not rely on anything as crass
            as physical assault, putting brain before brawn by using psychic attacks to bend their
            enemies to their will. While the Archmages of the other orders of magic believe themselves
            to be the biggest fish in the sea, the Phantasm mages see themselves as the ocean: vast,
            deep, teeming with life, and filled with the mysteries of the unknown.
            They abhor the primitive nature of Eradication and Verdant mages.
          </p>
        </section>
      </div>

      <ActionButton 
        :proxy-fn="register"
        :disabled="registerData.mageName === ''"
        :label="'Create'" />
    </section>

    <div v-if="errorStr" class="text-[#e41] bg-[#200] p-1 mt-2">
      {{ errorStr }}
    </div>
  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import magic from '@/components/magic.vue';
import ActionButton from '@/components/action-button.vue';
import { readableStr } from '@/util/util';

const registerData = ref({ mageName: '', magic: 'ascendant' });
const router = useRouter();
const mageStore = useMageStore();
const errorStr = ref('');


const register = async () => {
  errorStr.value = '';

  if (!registerData.value.mageName || registerData.value.mageName.length < 2) {
    errorStr.value = 'Mage name needs to be at least 3 characters';
    return;
  }

  try {
    const r = await API.post('/mage', registerData.value);
    if (r.data) {
      mageStore.setMage(r.data.mage);

      setTimeout(() => {
        console.log('redirecting...');
        router.push({ name: 'about' });
      }, 400);
    }
  } catch (err: any) {
    if (err.response?.status === 409) {
      errorStr.value = err.response?.data.error;
      console.error(err);
    }
  }
};
</script>
