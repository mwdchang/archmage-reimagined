<template>
  <main style="width: 100%">
    <section class="form" style="width: 100%; max-width: 100%"> 
      <div>
        <h2 style="margin-bottom: 1rem">Create mage</h2>
        <div class="row" style="align-items: baseline; gap: 10px; max-width: 25rem">
          <span style="width: 5rem">Name</span> 
          <input @keyup.enter="register" name="username" type="text"
            v-model="registerData.mageName">
        </div>

        <div class="row" style="align-items: baseline; gap: 10px; max-width: 25rem">
          <span style="width: 5rem">Magic 
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

      <h2 class="row">
        <magic :magic="registerData.magic" />  {{ readableStr(registerData.magic) }}
      </h2>
      <div class="row" style="gap: 20px">
        <section style="margin-left: 1rem">
          <img v-show="registerData.magic === 'ascendant'" src="@/assets/images/ascendant-new.png" />
          <img v-show="registerData.magic === 'verdant'" src="@/assets/images/verdant-new.png" />
          <img v-show="registerData.magic === 'eradication'" src="@/assets/images/eradication-new.png" />
          <img v-show="registerData.magic === 'nether'" src="@/assets/images/nether-new.png" />
          <img v-show="registerData.magic === 'phantasm'" src="@/assets/images/phantasm-new.png" />
        </section>

        <section class="magic-desc">
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

    <div class="error">
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

<style scoped>
img {
  height: 150px;
}

.magic-desc {
  max-width: 55vw;
  line-height: 1.35rem
}

.magic-desc {
  max-width: 90vw;
  line-height: 1.35rem
}

@media (min-width: 1024px) {
  .magic-desc {
    max-width: 50vw;
    line-height: 1.35rem
  }
}
</style>
