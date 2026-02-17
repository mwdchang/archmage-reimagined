<template>
  <main style="width: 100%">
    <section class="form" style="width: 100%; max-width: 100%"> 
      <div>
        <h2 style="margin-bottom: 1rem">Create new account</h2>
        <div class="row" style="align-items: baseline; gap: 10px; max-width: 25rem">
          <span style="width: 5rem">Username </span> 
          <input @keyup.enter="register" name="username" type="text"
            v-model="registerData.username">
        </div>
        <div class="row" style="align-items: baseline; gap: 10px; max-width: 25rem">
          <span style="width: 5rem">Password </span> 
          <input @keyup.enter="register" name="password" type="password"
            v-model="registerData.password">
        </div>
      </div>
      <ActionButton 
        :proxy-fn="register"
        :disabled="registerData.username === '' || registerData.password === ''"
        :label="'Create'" />
    </section>

    <div class="error">
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
