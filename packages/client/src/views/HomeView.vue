<template>
  <main>
    <h1 style="margin-bottom: 5px"> Archmage Reimagined </h1>
    <p style="max-width: 50rem; line-height: 1.25">
      Archmage Reimagined is a reimagination of the classica MMORPG Archmage, with new features and twists designed to be exciting for a modern audience.
    </p>
    <br>
    <div v-if="mode === 'registerMode'">
      <Register /> 
      <div> 
        If you already have a mage, <a @click="mode = 'loginMode'">login</a> here
      </div>
    </div>
    <div v-if="mode === 'loginMode'">
      <Login />
      <div> 
        If you do not have an account , you can <a @click="mode = 'registerMode'">reincarnate</a> a new mage.
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Register from '@/components/register.vue';
import Login from '@/components/login.vue';

const mode = ref<string>('loginMode');

</script>
