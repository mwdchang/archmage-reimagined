<template>
  {{ spell }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSpellById } from 'engine/src/base/references';
import { Spell } from 'shared/types/magic';

const props = defineProps<{ id: string }>(); 

const spell = ref<Spell|null>(null);

onMounted(() => {
  spell.value = getSpellById(props.id);
});
</script>
