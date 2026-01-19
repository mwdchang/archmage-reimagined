<template>
  <div>Skills view</div>
  <!--
  <div class="form-tabs">
    <div class="tab" :class="{ active: tabView === 'summon' }" @click="changeView('summon')">Summon</div>
    <div class="tab" :class="{ active: tabView === 'dispel' }" @click="changeView('dispel')">Dispel</div>
    <div class="tab" :class="{ active: tabView === 'casting' }" @click="changeView('casting')">Casting</div>
    <div class="tab" :class="{ active: tabView === 'buffs' }" @click="changeView('buffs')">Buffs</div>
  </div>
  -->

  <div class="form-tabs">
    <div 
      v-for="graph of skillGraphs"
      @click="changeView(graph.id)"
      :class="{ active: tabView === graph.id }"
      class="tab">
      {{ graph.name }}
    </div>
  </div>

</template>

<script lang="ts" setup>
import { getAllSkilGraphs } from 'engine/src/base/references';
import { SkillGraph } from 'shared/types/skills';
import { onMounted, ref } from 'vue';

const tabView = ref('');
const changeView = (v: string) => tabView.value = v;

const skillGraphs = ref<SkillGraph[]>([]);

onMounted(() => {
  skillGraphs.value = getAllSkilGraphs();
  tabView.value = skillGraphs.value[0].id;
})

</script>
