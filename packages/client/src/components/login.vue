<template>
  <main>
    <section class="form w-[28rem] max-w-full ml-12 opacity-80">
      <h2 class="section-header mb-2">Enter Terra</h2>
      <p class="mb-2">
        Register a new account by clicking on "Create account", or login with your existing credentials.
      </p>
      <div class="flex flex-row items-baseline gap-5 py-1">
        <span class="w-20 shrink-0">Username</span> 
        <input @keyup.enter="login" name="username" type="text" v-model="loginData.username">
      </div>

      <div class="flex flex-row items-baseline gap-5 py-1">
        <span class="w-20 shrink-0">Password</span> 
        <input @keyup.enter="login" name="password" type="password" v-model="loginData.password">
      </div>

      <div class="flex flex-row justify-between items-center py-1">
        <button @click="emit('register')" class="!bg-[#460]"> Create account</button>
        <ActionButton 
          :proxy-fn="login"
          :label="'Sign in'" />
      </div>

      <div v-if="error !== ''" class="text-[#d34] mt-2">{{ error }}</div>
    </section>

  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import ActionButton from '@/components/action-button.vue';


const emit = defineEmits(['register']);

const loginData = ref({ username: '', password: '', magic: 'ascendant' });
const mageStore = useMageStore();
const error = ref('');

const login = async () => {
  error.value = '';
  const r = await API.post('/login', { 
    username: loginData.value.username,
    password: loginData.value.password
  });
  if (!r.data) {
    error.value = `Cannot login with ${loginData.value.username}. If you don't have a mage, click "Create account"`;
    return;
  }

  if (r && r.data) {
    error.value = '';
    mageStore.setLoginUser(r.data.username);

    // See if we have a mage
    try {
      const r2 = await API.get('mage');
      mageStore.setMage(r2.data.mage);
    } catch (err) {
      mageStore.setMage(null);
    }
  }
};
</script>

