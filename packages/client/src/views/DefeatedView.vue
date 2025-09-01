<template>
  <h2>You have been defeated</h2>
  <p>Your mage survived for {{ mage!.turnsUsed }} turns.</p>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useMageStore } from '@/stores/mage';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);
</script>


