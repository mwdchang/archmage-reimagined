<template>
  <main v-if="targetSummary">
    <h3>
      You are attacking {{ targetSummary.name }} (#{{targetSummary.id}}) 
    </h3>
    <br>
    <table>
      <tbody>
        <tr>
          <td colspan="4">
            &nbsp;
          </td>
          <td> 
            <input type="checkbox" v-model="useAllStacks"> 
          </td>
        </tr>
        <tr v-for="(stack, _idx) of armySelection" :key="stack.id"
          @click="stack.active = !stack.active">
          <td> {{ stack.name }} </td>
          <td class="text-right"> {{ stack.size }} </td>
          <td class="text-right"> {{ stack.power }} </td>
          <td class="text-right"> {{ (100 * stack.powerPercentage).toFixed(2) }}% </td>
          <td>
              <input type="checkbox" v-model="stack.active">
          </td>
        </tr>
      </tbody>
    </table>

    <br>

    <table>
      <tbody>
        <tr>
          <td>Spell</td>
          <td>
            <select v-model="battleSpell">
              <option v-for="spell of battleSpells" :key="spell.id" :value="spell.id">{{ spell.name }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Item</td>
          <td>
            <select v-model="battleItem">
              <option v-for="item of battleItems" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>

    <br>
    <button @click="doBattle" :disabled="armySelection.filter(d => d.active).length === 0"> War </button>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { 
  getSpells, getItems, getBattleArmy,
  BattleArmyItem
} from '@/util/util';

const mageStore = useMageStore();
const router = useRouter();

const props = defineProps<{ targetId: string }>(); 

const targetSummary = ref<any>(null);
const armySelection = ref<BattleArmyItem[]>([]);
const battleSpell = ref('');
const battleItem = ref('');

const battleSpells = computed(() => {
  const mage = mageStore.mage; 
  if (!mage) return [];

  const result = getSpells(mage).filter(spell => {
    return spell.attributes.includes('battle');
  });

  // Add none option
  const noSpell = {
    id: '',
    magic: '',
    name: 'None',
    castingCost: 0,
    castingTurn: 0,
    attributes: []
  };
  result.unshift(noSpell);

  return result;
});

const battleItems = computed(() => {
  const mage = mageStore.mage; 
  if (!mage) return [];

  const result = getItems(mage).filter(item => {
    return item.attributes.includes('battle');
  });

  // Add none option
  const noItem = {
    id: '',
    name: 'None',
    attributes: [],
    amount: 0
  }
  result.unshift(noItem);

  return result;
});


const useAllStacks = ref(false);

const doBattle = async () => {
  if (!mageStore.mage) return;
  if (!props.targetId || props.targetId === '') return;

  // const stackIds = mageStore.mage.army.map(d => d.id);
  const stackIds = armySelection.value.filter(d => d.active === true).map(d => d.id);
  if (stackIds.length === 0) {
    return;
  }

  const res = await API.post('/war', { 
    targetId: props.targetId,
    spellId: battleSpell.value,
    itemId: battleItem.value,
    stackIds
  });

  if (res.data.reportId) {
    mageStore.setMage(res.data.mage);
    // console.log('battle report 1', res.data.reportId);
    // console.log('battle report 2', res.data.mage);
    router.push({
      name: 'battleResult',
      params: {
        id: res.data.reportId
      }
    });
  }
};


onMounted(async () => {
  // Resolve target
  const res = await API.get(`/mage/${props.targetId}`);
  targetSummary.value = res.data.mageSummary;

  if (!mageStore.mage) return;

  // Resolve army
  const rawArmy = getBattleArmy(mageStore.mage);
  armySelection.value = rawArmy.sort((a, b) => b.power - a.power);
});

watch(
  () => useAllStacks.value,
  () => {
    armySelection.value.forEach(d => {
      d.active = useAllStacks.value;
    });
  },
  { immediate: true }
);

</script>
