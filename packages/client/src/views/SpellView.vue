<template>
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
    <div style="max-height: 400px; overflow-y: scroll; padding: 0">
      <table v-if="spells.length > 0">
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
      <div v-else style="max-width: 250px">
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
            <option v-for="spell of castingSpells" :key="spell.id" :value="spell.id">{{ spell.name }}</option>
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
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { getSpells } from '@/util/util';
import Magic from '@/components/magic.vue';
import ActionButton from '@/components/action-button.vue';
import { readableNumber } from '@/util/util';
import { Spell } from 'shared/types/magic';
import ImageProxy from '@/components/ImageProxy.vue';

const mageStore = useMageStore();

const selected = ref<string>('');
const turns = ref<number>(1);
const target = ref<string>('');

const tabView = ref('summon');

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

const changeView = (v: string) => {
  tabView.value = v;
  selected.value = '';
};

const castSpell = async () => {
  if (!selected.value) return;

  const res = (await API.post('spell', {
    spellId: selected.value,
    num: turns.value,
    target: target.value
  })).data;

  if (res.result) {
    spellResult.value = res.result;
  }

  if (res.mage) {
    mageStore.setMage(res.mage);
  }
}

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
