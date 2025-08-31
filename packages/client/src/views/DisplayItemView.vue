<template>
  <main>
    {{ item }}
  </main>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Item } from 'shared/types/magic';
import { getItemById } from 'engine/src/base/references';
const props = defineProps<{ id: string }>(); 

const item = ref<Item|null>(null);
onMounted(() => {
  item.value = getItemById(props.id);
});
</script>
