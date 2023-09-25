<template>
  {{ unit }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUnitById } from 'engine/src/base/references';
import { Unit } from 'shared/types/unit';

const props = defineProps<{ id: string }>(); 

const unit = ref<Unit|null>(null);

onMounted(() => {
  unit.value = getUnitById(props.id);
});
</script>
