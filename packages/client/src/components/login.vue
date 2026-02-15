<template>
  <main>
    <section class="form" style="width: 28rem; margin-left: 3rem; opacity: 0.8">
      <h2 class="section-header" style="margin-bottom: 0.5rem">Enter Terra</h2>
      <p style="margin-bottom: 0.5rem">
        Reincarnate a new mage by clicking on "Create new mage", or login with your existing credentials.
      </p>
      <div class="row" style="align-items: baseline; gap: 20px">
        <span style="width:5rem">Username</span> 
        <input @keyup.enter="login" name="username" type="text" v-model="loginData.username">
      </div>

      <div class="row" style="align-items: baseline; gap: 20px">
        <span style="width:5rem">Password</span> 
        <input @keyup.enter="login" name="password" type="password" v-model="loginData.password">
      </div>

      <div class="row" style="justify-content: space-between">
        <button @click="emit('register')" style="background: #460"> Create new mage</button>
        <ActionButton 
          :proxy-fn="login"
          :label="'Login'" />
      </div>

      <div v-if="error !== ''" style="color: #d34">{{ error }}</div>
    </section>

  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import ActionButton from '@/components/action-button.vue';


const emit = defineEmits(['register']);

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
    error.value = `Cannot login with ${loginData.value.username}. If you don't have a mage, click "Create new mage"`;
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

