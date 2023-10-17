<template>
  <main v-if="targetSummary">
    <h3>
      You are attacking {{ targetSummary.name }} (#{{targetSummary.id}}) 
    </h3>
    <table>
      <tr v-for="(stack, idx) of armySelection" :key="stack.id"
        @click="stack.active = !stack.active">
        <td> {{ stack.id }} </td>
        <td class="text-right"> {{ stack.size }} </td>
        <td class="text-right"> {{ stack.power }} </td>
        <td class="text-right"> {{ (stack.power / armyPower).toFixed(2) }}% </td>
        <td>
            <input type="checkbox" v-model="stack.active">
        </td>
      </tr>
    </table>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { getUnitById } from 'engine/src/base/references';
import { npMultiplier } from 'engine/src/base/unit';
const mageStore = useMageStore();

interface UnitSelection {
  id: string
  name: string
  size: number
  active: boolean
  power: number
}

const props = defineProps<{ targetId: string }>(); 

const targetSummary = ref<any>(null);
const armySelection = ref<UnitSelection[]>([]);
const armyPower = ref(0);


onMounted(async () => {
  // Resolve target
  const res = await API.get(`/mage/${props.targetId}`);
  targetSummary.value = res.data.mageSummary;

  const rawUnits: UnitSelection[] = [];
  let totalArmyPower = 0;

  if (!mageStore.mage) return;

  // Resolve army
  mageStore.mage.army.forEach(d => {
    const unit = getUnitById(d.id);

    const multiplier = npMultiplier(unit);

    rawUnits.push({
      id: d.id,
      name: unit.name,
      size: d.size,
      active: false,
      power: multiplier * unit.powerRank * d.size
    });
    totalArmyPower += multiplier * unit.powerRank * d.size;
  });

  armySelection.value = rawUnits;
  armyPower.value = totalArmyPower;
});

</script>
