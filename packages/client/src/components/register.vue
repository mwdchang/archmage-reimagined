<template>
  <main class="w-full">
    <section class="form w-full max-w-full"> 
      <div>
        <h2 class="mb-4">Create new account</h2>
        <div class="flex flex-row items-baseline gap-[10px] max-w-[25rem] py-1">
          <span class="w-20 shrink-0">Username </span> 
          <input @keyup.enter="register" name="username" type="text"
            v-model="registerData.username">
        </div>
        <div class="flex flex-row items-baseline gap-[10px] max-w-[25rem] py-1">
          <span class="w-20 shrink-0">Password </span> 
          <input @keyup.enter="register" name="password" type="password"
            v-model="registerData.password">
        </div>
      </div>
      <ActionButton 
        :proxy-fn="register"
        :disabled="registerData.username === '' || registerData.password === ''"
        :label="'Create'" />
    </section>

    <div v-if="errorStr" class="text-[#e41] bg-[#200] p-1 mt-2">
      {{ errorStr }}
    </div>
  </main>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import ActionButton from '@/components/action-button.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const registerData = ref({ username: '', password: '', magic: 'ascendant' });
const mageStore = useMageStore();
const errorStr = ref('');

const register = async () => {
  errorStr.value = '';

  if (!registerData.value.username || registerData.value.username.length < 2) {
    errorStr.value = 'Name needs to be at least 3 characters';
    return;
  }

  try {
    const r = await API.post('/register', registerData.value);
    if (r) {
      mageStore.setLoginUser(r.data.username);
      setTimeout(() => {
        emit('close');
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
