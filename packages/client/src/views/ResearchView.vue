<template>
  <main v-if="mageStore.mage">
    <h3>Research</h3>
    <p> 
      You are generating {{ rp }} research points per turn.
    </p>
    <table>
      <tr>
        <td>&nbsp;</td>
        <td>Spell</td>
        <td>Cost</td>
        <td>Turns</td>
      </tr>
      <tr v-for="(magic, idx) in filteredMagicTypes" :key="magic" 
        :class="{active: currentResearch[magic].active}"
        @click="toggle(magic)">
        <td> <magic :magic="magic" /></td>
        <td>
          {{ currentResearch[magic].id }}
        </td>
        <td>
          {{ currentResearch[magic].remainingCost }}
        </td>
        <td>
          {{ Math.ceil(currentResearch[magic].remainingCost / rp) }}
        </td>
      </tr>
    </table>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import magic from '@/components/magic.vue';
import { useMageStore } from '@/stores/mage';
import { magicTypes } from 'engine/src/base/references';
import { researchPoints } from 'engine/src/magic';
const mageStore = useMageStore();

const rp = computed(() => {
  return researchPoints(mageStore.mage);
});

const currentResearch = ref(mageStore.mage.currentResearch);

const filteredMagicTypes = computed(() => {
  return magicTypes.filter(m => {
    return mageStore.mage.currentResearch[m];
  });
});

const toggle = (magic: string) => {
  filteredMagicTypes.value.forEach(d => {
    currentResearch.value[d].active = false;
  });
  currentResearch.value[magic].active = true;
}

</script>

<style scoped>
table > tr {
  cursor: pointer;
}
</style>
