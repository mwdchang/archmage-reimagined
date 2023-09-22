<template>
  <main>
    <h2>Login</h2>
    Username: <input name="username" type="text" v-model="loginData.username">
    <br>
    Password: <input name="password" type="password" v-model="loginData.password">
    <br>
    <button @click="login">Login</button>
    <br>
    <div v-if="error !== ''" style="color: #d34">{{ error }}</div>
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
const error = ref('');

const login = async () => {
  const r = await API.post('/login', { 
    username: loginData.value.username,
    password: loginData.value.password
  });
  if (!r.data) {
    error.value = `Cannot login with ${loginData.value.username}`;
    return;
  }

  if (r && r.data) {
    error.value = '';
    mageStore.setLoginStatus(1);
    mageStore.setMage(r.data.mage);
    setTimeout(() => {
      router.push({ name: 'about' });
    }, 600);
  }
};
</script>

