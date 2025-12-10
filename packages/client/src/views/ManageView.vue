<template>
  <div class="form-tabs">
    <div class="tab" :class="{ active: tabView === 'message' }" @click="changeView('message')">Messages</div>
    <div class="tab" :class="{ active: tabView === 'option' }" @click="changeView('option')">Options</div>
  </div>

  <Inbox v-if="tabView === 'message'" />
  <section v-else>
    Coming soon ...
  </section>

</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Inbox from '@/components/inbox.vue';

const tabView = ref('message');

const changeView = (v: string) => {
  tabView.value = v;
};

</script>


