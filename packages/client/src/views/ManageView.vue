<template>
  <div class="form-tabs">
    <div class="tab" :class="{ active: tabView === 'message' }" @click="changeView('message')">Messages</div>
    <div class="tab" :class="{ active: tabView === 'option' }" @click="changeView('option')">Options</div>
  </div>

  Coming soon ...

</template>

<script lang="ts" setup>
import { ref } from 'vue';

const tabView = ref('message');

const changeView = (v: string) => {
  tabView.value = v;
};

</script>


