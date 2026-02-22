<template>
  <main>
    <section v-if="targetSummary">
      <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
        <ImageProxy src="/images/ui/battle2.png" />
        <div>
          <div class="section-header">War</div>
          You are {{ battleTypeStr }} {{ targetSummary.name }} (#{{targetSummary.id}}) kingdom.
          You can send up to 10 army stacks into battle.
          <span v-if="battleType === 'siege'">
            Defenders are tougher in siege attacks.
          </span>
        </div>
      </div>
      <table style="min-width: 20rem">
        <tbody>
          <tr>
            <td>Unit</td> 
            <td>Size</td>
            <!--<td>Power</td>-->
            <td>Power %</td>
            <td> 
              <input type="checkbox" v-model="useAllStacks" v-if="battleType !== 'pillage'"> 
            </td>
          </tr>
          <tr v-for="(stack, _idx) of armySelection" :key="stack.id"
            @click="stack.active = !stack.active">
            <td> 
              <router-link :to="{ name: 'viewUnit', params: { id: stack.id }}"> {{ stack.name }} </router-link>
            </td>
            <td class="text-right"> {{ readableNumber(stack.size) }} </td>
            <!--
            <td class="text-right"> {{ readableNumber(stack.power) }} </td>
            -->
            <td class="text-right"> {{ (100 * stack.powerPercentage).toFixed(2) }}% </td>
            <td>
                <input type="checkbox" v-model="stack.active" v-if="battleType !== 'pillage'">
                <input type="radio" :value="stack.id" v-model="pillageStackId" v-if="battleType === 'pillage'">
            </td>
          </tr>
        </tbody>
      </table>

      <br>

      <section class="form" style="width: 25rem">
        <div class="row" style="align-items: baseline" v-if="battleType !== 'pillage'">
          <label style="width:6rem">Spell</label>
          <select v-model="battleSpell">
            <option v-for="spell of battleSpells" :key="spell.id" :value="spell.id">{{ spell.name }} ({{ maxCast(spell) }})  </option>
          </select>
        </div>
        <div class="row" style="align-items: baseline" v-if="battleType !== 'pillage'">
          <label style="width:6rem">Item</label>
          <select v-model="battleItem">
            <option v-for="item of battleItems" :key="item.id" :value="item.id">{{ item.name }} ({{ item.amount }})</option>
          </select>
        </div>

        <ActionButton 
          v-if="battleType !== 'pillage'"
          :proxy-fn="doBattle"
          :disabled="armySelection.filter(d => d.active).length === 0"
          :label="readableStr(battleType)" />
        <ActionButton 
          v-if="battleType === 'pillage'"
          :proxy-fn="doBattle"
          :disabled="pillageStackId === null"
          :label="readableStr(battleType)" />

      </section>
    </section>
    <div v-for="error of errorStrs" class="error">
      {{ error }}
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { API, APIWrapper } from '@/api/api';
import ActionButton from '@/components/action-button.vue';
import { useMageStore } from '@/stores/mage';
import { 
  getSpells, getItems, getBattleArmy, readableNumber,
  BattleArmyItem, readableStr,
  spellDisplay
} from '@/util/util';
import ImageProxy from '@/components/ImageProxy.vue';
import { Spell } from 'shared/types/magic';

const mageStore = useMageStore();
const router = useRouter();

const props = defineProps<{ 
  targetId: string,
  battleType: 'siege' | 'regular' | 'pillage' 
}>(); 

const targetSummary = ref<any>(null);
const armySelection = ref<BattleArmyItem[]>([]);
const battleSpell = ref('');
const battleItem = ref('');
const pillageStackId = ref<string|null>(null);

const battleTypeStr = computed(() => {
  if (props.battleType === 'siege') return 'sieging';
  if (props.battleType === 'regular') return 'attacking';
  if (props.battleType === 'pillage') return 'pillaging';
});

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

const maxCast = (spell: Spell) => {
  if (spell.id === '') return 0;
  const meta = spellDisplay(mageStore.mage!, spell);
  if (!meta.castingCost) return 0;

  return Math.floor(mageStore.mage!.currentMana / meta.castingCost);
}


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

  result.sort((a, b) => a.id.localeCompare(b.id));

  result.unshift(noItem);

  return result;
});


const useAllStacks = ref(false);
const errorStrs = ref<string[]>([]);

const doBattle = async () => {
  if (!mageStore.mage) return;
  if (!props.targetId || props.targetId === '') return;

  const stackIds = props.battleType === 'pillage' ? 
    [pillageStackId.value] :
    armySelection.value.filter(d => d.active === true).map(d => d.id);

  if (stackIds.length === 0) {
    return;
  }

  const { data, error } = await APIWrapper(() => {
    errorStrs.value = [];

    return API.post('/war', { 
      targetId: props.targetId,
      battleType: props.battleType,
      spellId: battleSpell.value,
      itemId: battleItem.value,
      stackIds
    });
  });

  if (error) {
    errorStrs.value.push(error);
    return
  }


  /*
  const res = await API.post('/war', { 
    targetId: props.targetId,
    battleType: props.battleType,
    spellId: battleSpell.value,
    itemId: battleItem.value,
    stackIds
  });
  */

  // eg: not in range, or insufficient number of turns
  if (data.errors.length > 0) {
    errorStrs.value = data.errors;
    return;
  }

  if (data.reportId) {
    mageStore.setMage(data.mage);
    router.push({
      name: 'battleResult',
      params: {
        id: data.reportId
      }
    });
  }
};


onMounted(async () => {
  // Resolve target
  const { data, error } = await APIWrapper(() => {
    errorStrs.value = [];
    return API.get(`/mage/${props.targetId}`)
  });

  if (error) {
    errorStrs.value.push(`Cannot find mage id ${props.targetId}`);
    return
  }

  if (data) {
    targetSummary.value = data.mageSummary;
  }

  // const res = await API.get(`/mage/${props.targetId}`);
  // targetSummary.value = res.data.mageSummary;

  if (!mageStore.mage) {
    errorStrs.value.push('Cannot find mage data');
    return;
  }

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
