<template>
  <main>
    <div class="row" style="width: 35rem; margin-bottom: 0.5rem">
      <ImageProxy src="/images/ui/spell.png" />
      <div>
        <div class="section-header">Cast Magic</div>
        <div>
          You have {{ spells.length }} spells in your spell book.
        </div>
      </div>
    </div>
    <section class="row" style="align-items: flex-start; gap: 0.5rem; margin-top: 10px">

      <div v-if="showArmy">
        <table style="margin-bottom: 0.5rem"> 
          <tbody>
            <tr>
              <td>Unit</td>
              <td v-if="layout === 'table'" class="text-right">Upkeep</td>
              <td class="text-right">Size</td>
              <td class="text-right">Power</td>
            </tr>
            <tr v-for="(u, _idx) of unitsStatus" :key="u.id">
              <td> 
                <router-link :to="{ name: 'viewUnit', params: { id: u.id }}"> {{ u.name }} </router-link>
              </td>
              <td v-if="layout === 'table'" class="text-right"> 
                {{ readableNumber(u.upkeep.geld) }} / {{ readableNumber(u.upkeep.mana) }} / {{ readableNumber(u.upkeep.population) }} 
              </td>
              <td class="text-right" style="padding-left: 10px"> {{ readableNumber(u.size) }} </td>
              <td class="text-right"> {{ (100 * u.powerPercentage).toFixed(2) }}%</td>
            </tr>
          </tbody>
        </table>

        <p>Net Income</p>
        <table>
          <thead>
            <tr>
              <th>Geld</th>
              <th>Mana</th>
              <th>Population</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-right"> {{ readableNumber(Math.floor(netUpkeepStatus.geld)) }} </td>
              <td class="text-right"> {{ readableNumber(Math.floor(netUpkeepStatus.mana)) }} </td>
              <td class="text-right"> {{ readableNumber(Math.floor(netUpkeepStatus.population)) }} </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showArmy === false" style="max-height: 400px; overflow-y: scroll; padding: 0">
        <table v-if="spells.length > 0 && layout === 'table'">
          <thead style="position: sticky; top: 0; z-index: 10">
            <tr>
              <th>Name</th>
              <th>&nbsp;</th>
              <th>Turns</th>
              <th>Mana Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="spell of castingSpells" :key="spell.id">
              <td>
                <router-link :to="{ name: 'viewSpell', params: { id: spell.id }}"> {{ spell.name }} </router-link>
              </td>
              <td><magic :magic="spell.magic" small /></td>
              <td class="text-right">{{ spell.castingTurn }}</td>
              <td class="text-right">{{ readableNumber(spell.castingCost) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="spells.length > 0 && layout === 'cards'">
          <div class="card" v-for="spell of castingSpells" :key="spell.id">
            <div class="row">
              <magic :magic="spell.magic" small />
              <router-link :to="{ name: 'viewSpell', params: { id: spell.id }}"> {{ spell.name }} </router-link>
            </div>
            <div class="card-grid-2">
              <div>Turns</div>
              <div class="text-right">{{ spell.castingTurn }}</div>
              <div>Mana cost</div>
              <div class="text-right">{{ readableNumber(spell.castingCost) }}</div>
            </div>
          </div>
        </div>

        <div v-if="spells.length === 0" style="max-width: 250px">
          You do not have any spells in your spellbook.
          Use <router-link :to="{ name: 'research' }">research</router-link> to learn new spells.
        </div>
      </div>

      <div>
        <section class="form" style="max-width: 20rem">
          <div class="form-tabs">
            <div class="tab" :class="{ active: tabView === 'summon' }" @click="changeView('summon')">Summon</div>
            <div class="tab" :class="{ active: tabView === 'spell' }" @click="changeView('spell')">Spells</div>
            <div class="tab" :class="{ active: tabView === 'battle' }" @click="changeView('battle')">Battle</div>
          </div>

          <div v-if="tabView !== 'battle'">
            <label>Select spell</label>
            <select v-model="selected" v-if="spells.length > 0" style="max-width:175px" tabindex=1>
              <option v-for="spell of castingSpells" :key="spell.id" :value="spell.id">{{ spell.name }} ({{ maxCast(spell) }})</option>
            </select>

            <div v-if="tabView === 'spell'">
              <label>Target</label>
              <input type="text" v-model="target" tabindex=2 />
            </div>

            <label># of times</label>
            <input type="number" v-model="turns" tabindex=3 />

            <ActionButton 
              :proxy-fn="castSpell"
              :label="'Cast spell'" />

          </div>
          <div v-else>
            <p>
              You can configure your defensive battle spells under
              <router-link :to="{ name: 'assignment' }">
                Assignment
              </router-link>
            </p>
          </div>
        </section>

        <div v-if="spellResult.length">
          <div v-for="(d, idx) of spellResult" :key="idx" :class="{'error': d.type === 'error'}">
            {{ d.message }}
          </div>
        </div>
      </div>

    </section>
  </main>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { computed, onMounted, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getArmy, getSpells, spellDisplay } from '@/util/util';
import Magic from '@/components/magic.vue';
import ActionButton from '@/components/action-button.vue';
import { readableNumber } from '@/util/util';
import { Spell } from 'shared/types/magic';
import ImageProxy from '@/components/ImageProxy.vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@/composables/useLayout';
import { useEngine } from '@/composables/useEngine';

const route = useRoute();

const mageStore = useMageStore();
const { layout } = useLayout();
const { netUpkeepStatus } = useEngine();


const selected = ref<string>('');
const turns = ref<number>(1);
const target = ref<string>('');

const tabView = ref('summon');
const showArmy = ref(false);

const spellResult = ref<any[]>([]);

const spells = computed<Spell[]>(() => {
  const mage = mageStore.mage;
  if (!mage) return [];

  const result = getSpells(mage);
  return result;
});



const castingSpells = computed(() => {
  return spells.value
    .filter(spell => {

      if (tabView.value === 'battle') {
        return spell.castingTurn <= 0;
      } else if (tabView.value === 'summon') {
        return spell.castingTurn > 0 && spell.attributes.includes('summon');
      }
      return spell.castingTurn > 0 && spell.attributes.includes('summon') === false;
    });
});

const unitsStatus = computed(() => {
  if (!mageStore.mage) return []
  let rawArmy = getArmy(mageStore.mage);

  return rawArmy.sort((a, b) => b.power - a.power);
});


const changeView = (v: string) => {
  tabView.value = v;
  selected.value = '';
  if (tabView.value !== 'summon') {
    showArmy.value = false;
  }
};

const maxCast = (spell: Spell) => {
  const meta = spellDisplay(mageStore.mage!, spell);
  if (!meta.castingCost) return 0;
  return Math.floor(mageStore.mage!.currentMana / meta.castingCost);
}


const castSpell = async () => {
  if (!selected.value) return;

  const res = (await API.post('spell', {
    spellId: selected.value,
    num: turns.value,
    target: target.value
  })).data;

  if (res.result) {
    if (tabView.value === 'summon') {
      showArmy.value = true;
    } else {
      showArmy.value = false;
    }
    spellResult.value = res.result;
  }

  if (res.mage) {
    mageStore.setMage(res.mage);
  }
}

onMounted(() => {
  const targetId = route.query.targetId;
  if (targetId && +targetId > 0) {
    changeView('spell');
    target.value = '' + targetId;
  }
});

</script>

<style scoped>
tr:nth-child(odd) {
  background: #222222;
}

td {
  padding-top: 1px;
  padding-bottom: 1px;
}

</style>
