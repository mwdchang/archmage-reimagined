<template>
  <main>
    <h2>Login</h2>
    Username: <input name="username" type="text" v-model="loginData.username">
    <br>
    Password: <input name="password" type="password" v-model="loginData.password">
    <br>
    <button @click="login">Login</button>
  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';

const loginData = ref({ username: '', password: '', magic: 'ascendant' });
const router = useRouter();
const mageStore = useMageStore();

const login = async () => {
  const r = await API.post('/login', { 
    username: loginData.value.username,
    password: loginData.value.password
  });
  if (r) {
    mageStore.setLoginStatus(1);
    mageStore.setMage(r.data.mage);
    setTimeout(() => {
      router.push({ name: 'about' });
    }, 500);
  }
};
</script>

