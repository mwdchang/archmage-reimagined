<template>
  <main>
    <h2>Login</h2>

    <section class="form" style="width: 25rem">
      <div class="row" style="align-items: baseline; gap: 20px">
        <span style="width:5rem">Username</span> 
        <input @keyup.enter="login" name="username" type="text" v-model="loginData.username">
      </div>

      <div class="row" style="align-items: baseline; gap: 20px">
        <span style="width:5rem">Password</span> 
        <input @keyup.enter="login" name="password" type="password" v-model="loginData.password">
      </div>

      <ActionButton 
        :proxy-fn="login"
        :disabled="loginData.username === '' || loginData.password === ''"
        :label="'Login'" />

    </section>

    <div v-if="error !== ''" style="color: #d34">{{ error }}</div>
  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import ActionButton from '@/components/action-button.vue';

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
</style>

