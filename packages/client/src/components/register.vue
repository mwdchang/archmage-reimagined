<template>
  <main>
    <h2>Register</h2>
    Username: <input name="username" type="text" v-model="registerData.username">
    <br>
    Password: <input name="password" type="password" v-model="registerData.password">
    <br>
    Magic: <select v-model="registerData.magic">
      <option value="ascendant">Ascendant</option>
      <option value="verdant">Verdant</option>
      <option value="eradication">Eradication</option>
      <option value="nether">Nether</option>
      <option value="phantasm">Phantasm</option>
    </select>
    <br>
    <button @click="register">Register</button>
  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';

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
    }, 550);
  }
};
</script>

