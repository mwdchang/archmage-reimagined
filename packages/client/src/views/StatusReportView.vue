<template>
  <main>
    <h3>Status Report</h3>
    <div class="section-header">General Info</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td>Rank</td>
          <td class="text-right">{{ mage.rank }}</td>
          <td>Power</td>
          <td class="text-right">{{ readableNumber(totalNetPower(mage)) }} </td>
        </tr>
        <tr>
          <td>Land</td>
          <td class="text-right">{{ readableNumber(totalLand(mage)) }}</td>
          <td>Forts</td>
          <td class="text-right">{{ mage.forts}}</td>
        </tr>
        <tr>
          <td>Geld</td>
          <td class="text-right">{{ readableNumber(mage.currentGeld) }}</td>
          <td>Items</td>
          <td class="text-right">{{ readableNumber(numItems) }}</td>
        </tr>
        <tr>
          <td>Units</td>
          <td class="text-right">{{ readableNumber(totalUnits(mage)) }}</td>
          <td>Turns Left</td>
          <td class="text-right">{{ readableNumber(mage.currentTurn) }}</td>
        </tr>
        <tr><td colspan="4">&nbsp;</td></tr>
        <tr>
          <td colspan="2">Spell Level</td>
          <td colspan="2"> 
            {{ currentSpellLevel(mage) }} / {{ maxSpellLevel(mage) }} 
          </td>
        </tr>
        <tr>
          <td colspan="2">Population</td>
          <td colspan="2"> 
            {{ readableNumber(mage.currentPopulation) }}
          </td>
        </tr>
        <tr>
          <td colspan="2">Magic Power</td>
          <td colspan="2"> 
            {{ readableNumber(mage.currentMana) }} / {{ readableNumber(maxMana(mage)) }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="section-header">Spell Resistance</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td> 
            <div class="row">
              <magic :magic="''" />
              Barrier 
            </div>
          </td> 
          <td class="text-right"> 
            {{ numberFormatter(resistanceStatus.barriers) }} 
          </td>
        </tr>
        <tr v-for="(magic) of allowedMagicList" :key="magic">
          <td> 
            <div class="row">
              <magic :magic="magic" />
              {{ readableStr(magic) }}
            </div>
          </td> 
          <td class="text-right"> 
            {{ numberFormatter(resistanceStatus[magic]) }} 
          </td>
        </tr>
      </tbody>
    </table>

    <!--
    <div class="section-header">Relation with Gods</div>
    <div>--</div>
    -->

    <div class="section-header">Residential Info</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td>Max Residential Space</td>
          <td class="text-right">{{ readableNumber(Math.floor(maxPopulation(mage))) }}</td>
        </tr>
        <tr>
          <td>Food Production</td>
          <td class="text-right">{{ readableNumber(Math.floor(maxFood(mage))) }}</td>
        </tr>
        <!--
        <tr>
          <td>Max Population Available</td>
          <td>???</td>
        </tr>
        -->
        <tr>
          <td>Space for Units</td>
          <td class="text-right">{{ readableNumber(Math.floor(spacesForUnits(mage))) }}</td>
        </tr>
        <tr>
          <td>Real Max Population</td>
          <td class="text-right">{{ readableNumber(Math.floor(realMaxPopulation(mage))) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-header">Interior Info</div>
      <table v-if="mage">
        <tbody>
          <tr>
            <td>&nbsp;</td>
            <td class="text-right">Geld</td>
            <td class="text-right">Mana</td>
            <td class="text-right">Population</td>
          </tr>
          <tr>
            <td> Income </td>
            <td class="text-right"> {{ readableNumber(productionStatus.geld) }} </td>
            <td class="text-right"> {{ readableNumber(productionStatus.mana) }} </td>
            <td class="text-right"> {{ readableNumber(productionStatus.population) }} </td>
          </tr>
          <tr>
            <td> Unit upkeep </td>
            <td class="text-right"> {{ readableNumber(armyUpkeepStatus.geld) }} </td>
            <td class="text-right"> {{ readableNumber(armyUpkeepStatus.mana) }} </td>
            <td class="text-right"> {{ readableNumber(armyUpkeepStatus.population) }} </td>
          </tr>
          <tr>
            <td> Buiding upkeep </td>
            <td class="text-right"> {{ readableNumber(buildingUpkeepStatus.geld) }} </td>
            <td class="text-right"> {{ readableNumber(buildingUpkeepStatus.mana) }} </td>
            <td class="text-right"> {{ readableNumber(buildingUpkeepStatus.population) }} </td>
          </tr>
          <tr>
            <td> Spell upkeep </td>
            <td class="text-right"> {{ readableNumber(enchantmentUpkeepStatus.geld) }} </td>
            <td class="text-right"> {{ readableNumber(enchantmentUpkeepStatus.mana) }} </td>
            <td class="text-right"> {{ readableNumber(enchantmentUpkeepStatus.population) }} </td>
          </tr>
          <tr>
            <td> Recruit cost </td>
            <td class="text-right"> {{ readableNumber(recruitUpkeepStatus.geld) }}</td>
            <td class="text-right"> {{ readableNumber(recruitUpkeepStatus.mana) }} </td>
            <td class="text-right"> {{ readableNumber(recruitUpkeepStatus.population) }}</td>
          </tr>
          <tr>
            <td> Net income </td>
            <td class="text-right"> {{ readableNumber(netUpkeepStatus.geld) }} </td>
            <td class="text-right"> {{ readableNumber(netUpkeepStatus.mana) }} </td>
            <td class="text-right"> {{ readableNumber(netUpkeepStatus.population) }} </td>
          </tr>
        </tbody>
      </table>

    <div class="section-header">Building Info</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td> Land </td>
          <td class="text-right"> {{ readableNumber(totalLand(mage)) }} </td>
          <td> Wilderness </td>
          <td class="text-right"> {{ readableNumber(mage.wilderness) }} </td>
        </tr>
        <tr>
          <td>Farms</td>
          <td class="text-right"> {{ readableNumber(mage.farms) }} </td>
          <td>Towns</td>
          <td class="text-right"> {{ readableNumber(mage.towns) }} </td>
        </tr>
        <tr>
          <td>Workshops</td>
          <td class="text-right"> {{ readableNumber(mage.workshops) }} </td>
          <td>Barracks</td>
          <td class="text-right"> {{ readableNumber(mage.barracks) }} </td>
        </tr>
        <tr>
          <td>Nodes</td>
          <td class="text-right"> {{ readableNumber(mage.nodes) }} </td>
          <td>Guilds</td>
          <td class="text-right"> {{ readableNumber(mage.guilds) }} </td>
        </tr>
        <tr>
          <td>Forts</td>
          <td class="text-right"> {{ mage.forts }} </td>
          <td>Barriers</td>
          <td class="text-right"> {{ mage.barriers }} </td>
        </tr>
      </tbody>
    </table>

    <div class="section-header">Enchantments</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td>Enchantment</td>
          <td class="text-right">Level</td>
          <td class="text-right">Life</td>
        </tr>
        <tr v-for="(e, idx) of mage.enchantments" :key="idx">
          <td> 
            <router-link :to="{ name: 'viewSpell', params: { id: e.spellId }}"> 
              {{ readableStr(e.spellId) }} 
            </router-link>
          </td>
          <td class="text-right"> {{ e.spellLevel }} </td>
          <td class="text-right"> {{ e.life ? e.life : '-' }} </td>
        </tr>
        <tr v-for="(itemId, idx) of uniqueItemEnchantments" :key="idx">
          <td>
            <router-link :to="{ name: 'viewItem', params: { id: itemId }}"> 
              {{ readableStr(itemId) }}
            </router-link>
          </td>
          <td class="text-right">-</td> 
          <td class="text-right">-</td>
        </tr>
      </tbody>
    </table>


    <div class="section-header">Defence Assignment</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td> Defense spell </td><td> {{ mage.assignment.spellId }} </td>
        </tr>
        <tr>
          <td> Spell condition</td><td> {{ conditionString(mage.assignment.spellCondition) }} </td>
        </tr>
        <tr>
          <td> Defense item</td><td> {{ mage.assignment.itemId }} </td>
        </tr>
        <tr>
          <td> Item condition</td><td> {{ conditionString(mage.assignment.itemCondition) }} </td>
        </tr>
      </tbody>
    </table>


    <div class="section-header">Researching</div>
    <div v-if="mage && researchStatus.length > 0">
      {{ readableStr(researchStatus[0].id) }}, {{ researchStatus[0].remainingCost }} points remaining
    </div>

    <div class="section-header">Recruiting</div>
    <div>--</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td>Unit</td>
          <td class="text-right">Size</td>
        </tr>
        <tr v-for="recruit of mage.recruitments">
          <td> 
            <router-link :to="{ name: 'viewUnit', params: { id: recruit.id }}"> 
              {{ readableStr(recruit.id) }} 
            </router-link>
          </td>
          <td class="text-right"> {{ readableNumber(recruit.size) }} </td>
        </tr>
      </tbody>
    </table>

    <!--
    <div class="section-header">Skills</div>
    <div>--</div>
    -->

    <div class="section-header">Units</div>
    <table v-if="mage">
      <tbody>
        <tr>
          <td>Unit</td>
          <td class="text-right">Upkeep</td>
          <td class="text-right">Size</td>
          <td class="text-right">Power</td>
        </tr>
        <tr v-for="(u, _idx) of unitsStatus" :key="u.id">
          <td> 
            <router-link :to="{ name: 'viewUnit', params: { id: u.id }}"> {{ u.name }} </router-link>
          </td>
          <td class="text-right"> 
            {{ readableNumber(u.upkeep.geld) }} / {{ readableNumber(u.upkeep.mana) }} / {{ readableNumber(u.upkeep.population) }} 
          </td>
          <td class="text-right" style="padding-left: 10px"> {{ readableNumber(u.size) }} </td>
          <td class="text-right"> {{ (100 * u.powerPercentage).toFixed(2) }}%</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { useEngine } from '@/composables/useEngine';
import { storeToRefs } from 'pinia'
import { 
  maxPopulation,
  maxFood,
  spacesForUnits,
  realMaxPopulation,
} from 'engine/src/interior';

import { 
  totalLand,
  totalUnits,
  currentSpellLevel, 
  totalNetPower
} from 'engine/src/base/mage';
import { 
  maxSpellLevel,
  maxMana,
  calcKingdomResistance,
} from 'engine/src/magic';
import {
  getArmy, conditionString
} from '@/util/util';
import Magic from '@/components/magic.vue';
import { readableNumber, readableStr } from '@/util/util';  
import { allowedMagicList } from 'shared/src/common';
import { getAllUniqueItems, getUnitById } from 'engine/src/base/references';

const mageStore = useMageStore();
const { mage } = storeToRefs(mageStore);
const { 
  productionStatus,
  armyUpkeepStatus,
  buildingUpkeepStatus,
  recruitUpkeepStatus,
  enchantmentUpkeepStatus,
  netUpkeepStatus
} = useEngine();

const numberFormatter = (v: number) => {
  return v.toFixed(2);
}

const numItems = computed(() => {
  const keys = Object.keys(mage.value!.items);
  let num = 0;
  keys.forEach(key => {
    num += mage.value!.items[key];
  });
  return num;
});

const researchStatus = computed(() => {
  const mage = mageStore.mage;
  return Object.values(mage?.currentResearch as Object).filter(d => d && d.active === true);
});

const resistanceStatus = computed(() => {
  return calcKingdomResistance(mageStore.mage!);
});

const unitsStatus = computed(() => {
  if (!mageStore.mage) return []
  let rawArmy = getArmy(mageStore.mage);

  return rawArmy.sort((a, b) => b.power - a.power);
});

const uniqueItemEnchantments = computed(() => {
  const uniques = getAllUniqueItems().map(d => d.id);;

  return Object.keys(mageStore.mage!.items).filter(d => uniques.includes(d));
});

</script>


<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #282828;
  padding: 0.5rem;
}

table {
  border: none;
}

td {
  border: none;
  min-width: 80px;
  padding: 0;
  padding-right: 10px;
}

.section-header {
  margin-top: 15px;
}
</style>
