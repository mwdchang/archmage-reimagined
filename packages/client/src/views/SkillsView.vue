<template>
  <main>
    <div class="form-tabs">
      <div 
        v-for="graph of skillGraphs"
        @click="changeView(graph.id)"
        :class="{ active: tabView === graph.id }"
        class="tab">
        {{ readableStr(graph.name) }}
      </div>
    </div>

    <div style="margin-bottom: 0.5rem">
      You have {{ Math.floor(mageStore.mage!.skillPoints) }} skill points. You get a skill point every {{ skillRate }} turns.
    </div>


    <!-- Tech tree/graph -->
    <section v-if="selectedGraph">
      <div v-if="errorStr" class="error" style="position: absolute">{{ errorStr }}</div>
      <SkillGraphDisplay 
        :graph="selectedGraph" 
        :mage="mageStore.mage!"
        @add-skill="onAddSkill($event)"
        @view-skill="onViewSkill($event)"
      />
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import SkillGraphDisplay from '@/components/SkillGraphDisplay.vue';
import { Skill, SkillGraph } from 'shared/types/skills';
import { allowedMagicList } from 'shared/src/common';
import { getAllSkills } from 'engine/src/base/references';
import { useMageStore } from '@/stores/mage';
import { API, APIWrapper } from '@/api/api';
import { readableStr } from '@/util/util';
import { useRouter } from 'vue-router';
import { skillPoints } from 'engine/src/magic';


const mageStore = useMageStore();
const router = useRouter();
const errorStr = ref('');

const tabView = ref('');
const changeView = (v: string) => tabView.value = v;

const skillGraphs = ref<SkillGraph[]>([]);

const selectedGraph = computed(() => {
  const skillGraph = skillGraphs.value.find(d => d.id === tabView.value)!;

  return skillGraph ? skillGraph : null;
});

const skillRate = computed(() => {
  const rate = skillPoints(mageStore.mage!);
  return Math.ceil(1 / rate);
});


const onViewSkill = (skillId: string) => {
  router.push({ name: 'viewSkill', params: { id: skillId } });
};

const onAddSkill = async (skillId: string) => {
  console.log('adding', skillId);

  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post(`/skill`, { skillId })
  });

  if (error) {
    console.log('error', error);
    errorStr.value = error;
    return
  }

  if (data) {
    mageStore.setMage(data.mage);
  }
};

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
