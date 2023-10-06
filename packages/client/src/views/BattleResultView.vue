<template>
  {{ report.battleLogs }}
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';

const props = defineProps<{ id: string }>(); 
const report = ref<any>('');

console.log('!!!', props.id);


onMounted(async () => {
  const res = (await API.get(`/report/${props.id}`)).data;
  report.value = res.report;
});

</script>
