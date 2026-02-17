<template>
  <main class="column" style="align-items: center">
    <div class="form-tabs">
      <div class="tab" :class="{ active: tabView === 'message' }" @click="changeView('message')">Messages</div>
      <div class="tab" :class="{ active: tabView === 'option' }" @click="changeView('option')">Options</div>
    </div>

    <Inbox v-if="tabView === 'message'" />
    <Options v-else />
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Inbox from '@/components/inbox.vue';
import Options from '@/components/options.vue';

const tabView = ref('message');

const changeView = (v: string) => {
  tabView.value = v;
};

</script>


