<template>
  <main>
    <h2 style="display: flex"><magic :magic="registerData.magic"/> &nbsp;Register</h2>
    <section style="display: flex; align-items: center">
      <div>
        <div class="row">
          <span style="width: 5rem">Username:</span> <input @keyup.enter="register" name="username" type="text" v-model="registerData.username">
        </div>
        <div class="row">
          <span style="width: 5rem">Password:</span> <input @keyup.enter="register" name="password" type="password" v-model="registerData.password">
        </div>
        <div class="row">
          <span style="width: 5rem">Magic: </span>
          <select v-model="registerData.magic">
            <option value="ascendant">Ascendant</option>
            <option value="verdant">Verdant</option>
            <option value="eradication">Eradication</option>
            <option value="nether">Nether</option>
            <option value="phantasm">Phantasm</option>
          </select>
        </div>
      </div>
      <div>
        <section style="margin-left: 3rem">
          <img v-show="registerData.magic==='ascendant'" src="@/assets/images/ascendant.jpeg" />
          <img v-show="registerData.magic==='verdant'" src="@/assets/images/verdant.jpeg" />
          <img v-show="registerData.magic==='eradication'" src="@/assets/images/eradication.jpeg" />
          <img v-show="registerData.magic==='nether'" src="@/assets/images/nether.jpeg" />
          <img v-show="registerData.magic==='phantasm'" src="@/assets/images/phantasm.jpeg" />
        </section>
      </div>
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
        forms of sorcery.  Using the instinctive rage of every living creature, Verdant mages
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
      
    <button @click="register">Register</button>
  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import magic from './magic.vue';

const registerData = ref({ username: '', password: '', magic: 'ascendant' });
const router = useRouter();
const mageStore = useMageStore();

const register = async () => {
  const r = await API.post('/register',  registerData.value);
  console.log('register response', r.data);
  if (r) {
    mageStore.setLoginStatus(1);
    mageStore.setMage(r.data);
    setTimeout(() => {
      router.push({ name: 'about' });
    }, 400);
  }
};
</script>

<style scoped>
.row {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  justify-items: flex-end;
  display: flex;
}

img {
  height: 150px;
}

.magic-desc {
  max-width: 55vw; 
  line-height:1.35rem
}

.magic-desc {
  max-width: 90vw; 
  line-height:1.35rem
}

@media (min-width: 1024px) {
  .magic-desc {
    max-width: 50vw; 
    line-height:1.35rem
  }
}

</style>
