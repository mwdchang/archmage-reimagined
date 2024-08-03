<template>
  <main>
    <h1> Archmage Reimagined </h1>
    <p style="max-width: 50rem; line-height: 1.25">
      Archmage Reimagined is a reimagination of the classica MMORPG Archmage, with new features and twists designed to be exciting for a modern audience.
    </p>
    <br>
    <div v-if="mode === 'registerMode'">
      <Register /> 
      <div> <a @click="mode = 'loginMode'">Login</a> </div>
    </div>
    <div v-if="mode === 'loginMode'">
      <Login />
      <div> <a @click="mode = 'registerMode'">Register</a> </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Register from '@/components/register.vue';
import Login from '@/components/login.vue';

const mode = ref<string>('loginMode');

</script>
