<template>
  <main>
    <section class="form">
      <h3 class="section-header">Description</h3>
      <p style="margin-bottom: 0.5rem">Change your mage's description</p>
      <textarea style="margin-bottom: 0.5rem; width: 80%; height: 5rem">
      </textarea>

      <h3 class="section-header">Depart from Terra</h3>
      <div style="margin-bottom: 0.5rem">
        Your mage will be banished. You can only leave if you have no blood on your hands for the last 24 hours.
      </div>
      <div class="row" style="align-items: baseline; gap: 10px">
        <input type="checkbox" v-model="confirmDelete" style="width:15px; height:15px"> 
        <label>Confirm disband</label>
        <ActionButton 
          :proxy-fn="deleteMage"
          :disabled="confirmDelete === false"
          :label="'Delete'" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ActionButton from './action-button.vue';

const confirmDelete = ref(false);

const deleteMage = async () => {
}
</script>
