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
import SkillGraphDisplay from '@/components/SkillGraphDisplay.vue';
import { Skill, SkillGraph } from 'shared/types/skills';
import { allowedMagicList } from 'shared/src/common';
import { getAllSkills } from 'engine/src/base/references';

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
  }
);

onMounted(() => {
  const allSkills = getAllSkills();
  for (const m of allowedMagicList) {
    skillGraphs.value.push({
      id: m,
      name: m,
      nodes: allSkills.filter(s => s.magic === m)
    });
  }
  tabView.value = skillGraphs.value[0].id;
})

</script>
