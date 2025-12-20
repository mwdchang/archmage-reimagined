<template>
  <section class="form" style="min-width: 35rem">
    <div class="row" style="gap: 2rem">
      <select v-model="selectedMagic" style="max-width:175px"> 
        <option value="ascendant">Ascendant</option>
        <option value="verdant">Verdant</option>
        <option value="eradication">Eradication</option>
        <option value="nether">Nether</option>
        <option value="phantasm">Phantasm</option>
      </select>
      <div>
        Spell level: {{ selectedSpellLevel }}

        <!-- Force rerender with :key -->
        <input type="range" 
          v-model="selectedSpellLevel"
          :key="maxSpellLevels[selectedMagic]"
          :min="1" 
          :max="maxSpellLevels[selectedMagic]" />
      </div>
    </div>

    <div class="form-tabs">
      <div class="tab" :class="{ active: tabView === 'summon' }" @click="changeView('summon')">Summon</div>
      <div class="tab" :class="{ active: tabView === 'dispel' }" @click="changeView('dispel')">Dispel</div>
      <div class="tab" :class="{ active: tabView === 'casting' }" @click="changeView('casting')">Casting</div>
    </div>


    <!-- Main content here -->
    <section style="margin-bottom: 0.5rem">
      <p v-if="tabView === 'summon'">
        Average summon over {{ NUM_SIMULATIONS}} simulations. 
        Spells that summons more than one type of unit will show averages as if all units are summoned.
      </p>
      <p v-if="tabView === 'dispel'">
        Dispell information
      </p>
    </section>

    <!-- summon -->
    <main v-if="tabView === 'summon'" style="width: 25rem">
      <div v-for="res of summonData" 
        :key="res.spellId + selectedMagic" 
        style="margin-bottom: 0.80rem; border-top: 1px solid #333">
        <div>{{ readableStr(res.spellId) }}</div>
        <div v-for="(v, k) of res.data" class="grid-container">
          <div class="grid-item row">
            <Magic :magic="getUnitMagic(k)" tiny/>
            {{ readableStr(k) }}
          </div>
          <div class="grid-item text-right">{{ readableNumber(v) }}</div>
        </div>
      </div>
    </main>

    <!-- dispell -->
    <main v-if="tabView === 'dispel'">
      <div>Caster spell level: {{ casterSpellLevel }} </div>
      <div class="row">
        <input type="range" 
          v-model="casterSpellLevel"
          min="1" max="999" />
      </div>
      <div>Mana used: {{ dispelMana }} </div>
      <div class="row">
        <input type="range" 
          v-model="dispelMana"
          min="0" max="500000" step="500" />
      </div>

      <div 
        class="grid-container"
        v-for="dd of dispelData" :key="dd.spellId">
        <div class="grid-item row">
          <Magic :magic="getSpellMagic(dd.spellId)" tiny/>
          {{ readableStr(dd.spellId) }}
        </div>
        <div class="grid-item text-right">{{ (100 * dd.prob).toFixed(2)}}%</div>
      </div>
    </main>


    <!-- summon -->
    <main v-if="tabView === 'casting'">
      <div>
        Concentration: {{ concentrationLevel }}

        <!-- Force rerender with :key -->
        <input type="range" 
          v-model="concentrationLevel"
          :key="maxSpellLevels[selectedMagic]"
          :min="1" 
          :max="maxSpellLevels[selectedMagic]" />
      </div>

      <div class="grid-container4x3">
        <div class="grid-item">&nbsp;</div>
        <div class="grid-item row">
          <Magic :magic="castingData.meta.self" />
        </div>
        <div class="grid-item row">
          <Magic v-for="m of castingData.meta.adjacent" :magic="m" />
        </div>
        <div class="grid-item row">
          <Magic v-for="m of castingData.meta.opposite" :magic="m" />
        </div>

        <div class="grid-item">Simple</div>
        <div class="grid-item">{{ castingData.simple.onColor }}</div>
        <div class="grid-item">{{ castingData.simple.adjacent }}</div>
        <div class="grid-item">{{ castingData.simple.opposite }}</div>

        <div class="grid-item">Average</div>
        <div class="grid-item">{{ castingData.average.onColor }}</div>
        <div class="grid-item">{{ castingData.average.adjacent }}</div>
        <div class="grid-item">{{ castingData.average.opposite }}</div>

        <div class="grid-item">Complex</div>
        <div class="grid-item">{{ castingData.complex.onColor }}</div>
        <div class="grid-item">{{ castingData.complex.adjacent }}</div>
        <div class="grid-item">{{ castingData.complex.opposite }}</div>

        <div class="grid-item">Ultimate</div>
        <div class="grid-item">{{ castingData.ultimate.onColor }}</div>
        <div class="grid-item" style="text-decoration: line-through;">{{ castingData.ultimate.adjacent }}</div>
        <div class="grid-item" style="text-decoration: line-through;">{{ castingData.ultimate.opposite }}</div>


      </div>
    </main>

  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import Magic from '@/components/magic.vue';
import { getAllSpells, getMaxSpellLevels, getSpellById, getUnitById } from 'engine/src/base/references';
import { AllowedMagic } from 'shared/types/common';
import { EffectOrigin, UnitSummonEffect } from 'shared/types/effects';
import { dispelEnchantment, successCastingRate, summonUnit } from 'engine/src/magic';
import { readableNumber, readableStr } from '@/util/util';
import { Enchantment, Mage } from 'shared/types/mage';
import { magicAlignmentTable } from 'engine/src/base/config';

const maxSpellLevels = getMaxSpellLevels();
const tabView = ref('summon');

const selectedMagic = ref<AllowedMagic>('ascendant');
const selectedSpellLevel = ref(1);
const concentrationLevel = ref(1);


const casterSpellLevel = ref(400);
const dispelMana = ref(20000);

const summonSpells = getAllSpells().filter(s => s.attributes.includes('summon'));
const enchantSpells = getAllSpells().filter(s => {
  return s.attributes.includes('enchantment') && !s.attributes.includes('selfOnly')
});

const changeView = (v: string) => tabView.value = v;

const getUnitMagic = (unitId: string) => {
  return getUnitById(unitId).magic;
};
const getSpellMagic = (spellId: string) => {
  return getSpellById(spellId).magic;
};


const simulateCasting = (spellId: string) => {
  const dummyMage: Partial<Mage> = {
    id: 888,
    name: 'test',
    magic: selectedMagic.value,
    testingSpellLevel: selectedSpellLevel.value,
    enchantments: []
  };
  if (concentrationLevel.value > 1) {
    dummyMage.enchantments!.push({
      id: 'concentration',
      casterId: 888,
      casterMagic: selectedMagic.value,
      spellId: 'concentration',
      spellLevel: concentrationLevel.value,
      isActive: true,
      targetId: 888,
      isPermanent: true,
      isEpidemic: false,
      life: 0
    });
  }

  return readableNumber(successCastingRate(dummyMage as any, spellId));
}


const simulateDispel = (spellId: string) => {
  const dummyMage: Partial<Mage> = {
    id: 888,
    name: 'test',
    magic: selectedMagic.value,
    testingSpellLevel: selectedSpellLevel.value,
    enchantments: []
  };

  const dummyEnchantment: Enchantment = {
    id: Date.now() + '',
    targetId:888, 
    spellId: spellId,
    spellLevel: casterSpellLevel.value,

    casterId: 999,
    casterMagic: 'phantasm',

    // Doesn't really matter
    isActive: true,
    isPermanent: true,
    isEpidemic: true,
    life: 999
  };
  return dispelEnchantment(dummyMage as any, dummyEnchantment, dispelMana.value);
};


const NUM_SIMULATIONS = 10;
const simulateSummon = (effect: UnitSummonEffect, origin: EffectOrigin) => {
  const summonResults: Record<string, number> = {};

  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    const result = summonUnit(effect, origin);
    Object.keys(result).forEach(key => {
      if (summonResults[key]) {
        summonResults[key] += result[key];
      } else {
        summonResults[key] = result[key];
      }
    });
  }

  // Average
  Object.keys(summonResults).forEach(key => {
    summonResults[key] /= NUM_SIMULATIONS;
  });
  return summonResults;
}

const summonData = computed(() => {
  const summonResults: { spellId: string, data: Record<string, number>}[] = [];
  const effectOrigin: EffectOrigin = {
    id: 888,
    targetId: 888,
    magic: selectedMagic.value,
    spellLevel: selectedSpellLevel.value
  };

  for (const spell of summonSpells) {
    const effect = spell.effects[0];
    const result = simulateSummon(effect as UnitSummonEffect, effectOrigin);
    summonResults.push({
      spellId: spell.id,
      data: result
    });
  }
  return summonResults;
});

const dispelData = computed(() => {
  const results: { spellId: string, prob: number }[] = [];
  enchantSpells.forEach(spell => {
    const prob = simulateDispel(spell.id);
    results.push({
      spellId: spell.id,
      prob: prob
    });
  });
  return results;
});

const castingData = computed(() => {
  const simples = getAllSpells().filter(s => s.rank === 'simple');
  const averages = getAllSpells().filter(s => s.rank === 'average');
  const complexes = getAllSpells().filter(s => s.rank === 'complex');
  const ultimates = getAllSpells().filter(s => s.rank === 'ultimate');

  const adjacent = magicAlignmentTable[selectedMagic.value].adjacent[0];
  const opposite = magicAlignmentTable[selectedMagic.value].opposite[0];

  const simple = {
    onColor: simulateCasting(simples.find(s => s.magic === selectedMagic.value)!.id),
    adjacent: simulateCasting(simples.find(s => s.magic === adjacent)!.id),
    opposite: simulateCasting(simples.find(s => s.magic === opposite)!.id)
  };

  const average = {
    onColor: simulateCasting(averages.find(s => s.magic === selectedMagic.value)!.id),
    adjacent: simulateCasting(averages.find(s => s.magic === adjacent)!.id),
    opposite: simulateCasting(averages.find(s => s.magic === opposite)!.id)
  };

  const complex = {
    onColor: simulateCasting(complexes.find(s => s.magic === selectedMagic.value)!.id),
    adjacent: simulateCasting(complexes.find(s => s.magic === adjacent)!.id),
    opposite: simulateCasting(complexes.find(s => s.magic === opposite)!.id)
  };

  const ultimate = {
    onColor: simulateCasting(ultimates.find(s => s.magic === selectedMagic.value)!.id),
    adjacent: simulateCasting(ultimates.find(s => s.magic === adjacent)!.id),
    opposite: simulateCasting(ultimates.find(s => s.magic === opposite)!.id)
  };

  return { 
    meta: {
      self: selectedMagic.value,
      adjacent: magicAlignmentTable[selectedMagic.value].adjacent,
      opposite: magicAlignmentTable[selectedMagic.value].opposite
    },
    simple,
    average,
    complex,
    ultimate
  };
});

watch(
  () => selectedMagic.value,
  () => {
    selectedSpellLevel.value = maxSpellLevels[selectedMagic.value];
  }
);

onMounted(() => {
  selectedSpellLevel.value = maxSpellLevels[selectedMagic.value];
});
</script>


<style scoped>
main {
  font-size: 0.9rem;
  padding: 0.25rem;
  height: 40rem;
  overflow-y: scroll;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem 1.25rem;
}

.grid-container4x3 {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem 1.25rem;
}



.grid-item {
  background-color: #212120;
  padding: 0.45rem 1rem;
  text-align: left;
  border-radius: 0.25rem;
  transition: filter 0.4s ease;
}

.grid-item.text-right {
  text-align: right;
}
</style>
