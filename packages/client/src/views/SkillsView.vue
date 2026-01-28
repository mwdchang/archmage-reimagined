<template>
  <div>Skills view</div>

  <div class="form-tabs">
    <div 
      v-for="graph of skillGraphs"
      @click="changeView(graph.id)"
      :class="{ active: tabView === graph.id }"
      class="tab">
      {{ graph.name }}
    </div>
  </div>

  <!-- Tech tree/graph -->
  <main v-if="selectedGraph">
    <SkillGraphDisplay 
      :graph="selectedGraph" 
      :skills="[]"
    />
  </main>

</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { getAllSkilGraphs } from 'engine/src/base/references';
import { SkillGraph } from 'shared/types/skills';
import SkillGraphDisplay from '@/components/SkillGraphDisplay.vue';

const tabView = ref('');
const changeView = (v: string) => tabView.value = v;

const skillGraphs = ref<SkillGraph[]>([]);

const selectedGraph = computed(() => {
  const skillGraph = skillGraphs.value.find(d => d.id === tabView.value)!;

  return skillGraph ? skillGraph : null;
});

watch(
  () => tabView.value,
  () => {
    if (tabView.value === '') {
      return;
    }
    const skillGraph = skillGraphs.value.find(d => d.id === tabView.value)!;
  }
);

onMounted(() => {
  skillGraphs.value = getAllSkilGraphs();
  tabView.value = skillGraphs.value[0].id;
})

</script>
