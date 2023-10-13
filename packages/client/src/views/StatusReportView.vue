<template>
  <h2>Status Report</h2>
  <div class="section-header">General Info</div>
  <table v-if="mage">
    <tr>
      <td>Rank</td>
      <td class="text-right">{{ mage.rank }}</td>
      <td>Power</td>
      <td class="text-right">{{ totalNetPower(mage) }} </td>
    </tr>
    <tr>
      <td>Land</td>
      <td class="text-right">{{ totalLand(mage) }}</td>
      <td>Forts</td>
      <td class="text-right">{{ mage.forts}}</td>
    </tr>
    <tr>
      <td>Geld</td>
      <td class="text-right">{{ mage.currentGeld }}</td>
      <td>Items</td>
      <td class="text-right">{{ numItems }}</td>
    </tr>
    <tr>
      <td>Units</td>
      <td class="text-right">{{ totalUnits(mage) }}</td>
      <td>Turns Left</td>
      <td class="text-right">{{ mage.currentTurn }}</td>
    </tr>
    <tr>
      <td colspan="2">Spell Level</td>
      <td colspan="2"> 
        {{ currentSpellLevel(mage) }} / {{ maxSpellLevel(mage) }} 
      </td>
    </tr>
    <tr>
      <td colspan="2">Population</td>
      <td colspan="2"> 
        {{ mage.currentPopulation }}
      </td>
    </tr>
    <tr>
      <td colspan="2">Magic Power</td>
      <td colspan="2"> 
        {{ mage.currentMana }} / {{ maxMana(mage) }}
      </td>
    </tr>
  </table>

  <div class="section-header">Spell Resistance</div>
  <table v-if="mage">
    <tr>
      <td> Barrier </td> <td> {{ resistanceStatus.barrier }} </td>
    </tr>
    <tr>
      <td> Ascendant </td> <td> {{ resistanceStatus.ascendant }} </td>
    </tr>
    <tr>
      <td> Verdant </td> <td> {{ resistanceStatus.verdant }} </td>
    </tr>
    <tr>
      <td> Eradication </td> <td> {{ resistanceStatus.eradication }} </td>
    </tr>
    <tr>
      <td> Nether </td> <td> {{ resistanceStatus.nether }} </td>
    </tr>
    <tr>
      <td> Phantasm </td> <td> {{ resistanceStatus.phantasm }} </td>
    </tr>
  </table>

  <div class="section-header">Relation with Gods</div>
  <div class="section-header">Residential Info</div>
  <table v-if="mage">
    <tr>
      <td>Max Residential Space</td>
      <td>{{ maxPopulation(mage) }}</td>
    </tr>
    <tr>
      <td>Food Production</td>
      <td>{{ maxFood(mage) }}</td>
    </tr>
    <!--
    <tr>
      <td>Max Population Available</td>
      <td>???</td>
    </tr>
    -->
    <tr>
      <td>Space for Units</td>
      <td>{{ spacesForUnits(mage) }}</td>
    </tr>
    <tr>
      <td>Real Max Population</td>
      <td>{{ realMaxPopulation(mage) }}</td>
    </tr>
  </table>

  <div class="section-header">Interior Info</div>
    <table v-if="mage">
      <tr>
        <td>&nbsp;</td>
        <td>Geld</td>
        <td>Mana</td>
        <td>Population</td>
      </tr>
      <tr>
        <td> Income </td>
        <td> {{ geldIncome(mage) }} </td>
        <td> {{ manaIncome(mage) }} </td>
        <td> {{ populationIncome(mage) }} </td>
      </tr>
      <tr>
        <td> Unit upkeep </td>
        <td> {{ armyUpkeepStatus.geld }} </td>
        <td> {{ armyUpkeepStatus.mana }} </td>
        <td> {{ armyUpkeepStatus.population }} </td>
      </tr>
      <tr>
        <td> Buiding upkeep </td>
        <td> {{ buildingUpkeepStatus.geld }} </td>
        <td> {{ buildingUpkeepStatus.mana }} </td>
        <td> {{ buildingUpkeepStatus.population }} </td>
      </tr>


    </table>

  <div class="section-header">Building Info</div>
  <table v-if="mage">
    <tr>
      <td> Land </td>
      <td> {{ totalLand(mage) }} </td>
      <td> Wilderness </td>
      <td> {{ mage.wilderness }} </td>
    </tr>
    <tr>
      <td>Farms</td>
      <td> {{ mage.farms }} </td>
      <td>Towns</td>
      <td> {{ mage.towns}} </td>
    </tr>
    <tr>
      <td>Workshops</td>
      <td> {{ mage.workshops }} </td>
      <td>Barracks</td>
      <td> {{ mage.barracks}} </td>
    </tr>
    <tr>
      <td>Nodes</td>
      <td> {{ mage.nodes }} </td>
      <td>Library</td>
      <td> {{ mage.libraries }} </td>
    </tr>
    <tr>
      <td>Forts</td>
      <td> {{ mage.forts }} </td>
      <td>Barriers</td>
      <td> {{ mage.barriers }} </td>
    </tr>
  </table>

  <div class="section-header">Enchantments</div>
  <div class="section-header">Defence Assignment</div>
  <div class="section-header">Researching</div>
    <div v-if="mage && researchStatus.length > 0">
      {{ researchStatus[0].id }}, {{ researchStatus[0].remainingCost }} points remaining
    </div>

  <div class="section-header">Recruiting</div>
  <div class="section-header">Skills</div>
  <div class="section-header">Units</div>
  <table v-if="mage">
    <tr v-for="(u, _idx) of unitsStatus" :key="u.id">
      <td> 
        <router-link :to="{ name: 'viewUnit', params: { id: u.id }}"> {{ u.name }} </router-link>
      </td>
      <td> {{ u.upkeep.geld }} / {{ u.upkeep.mana }} / {{ u.upkeep.population }} </td>
      <td class="text-right" style="padding-left: 10px"> {{ u.size }} </td>
      <td class="text-right"> {{ (100 * u.power / totalArmyPower).toFixed(2) }}%</td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { storeToRefs } from 'pinia'
import { 
  maxPopulation,
  maxFood,
  spacesForUnits,
  geldIncome,
  populationIncome,
  armyUpkeep,
  buildingUpkeep,
  realMaxPopulation
} from 'engine/src/interior';

import { getUnitById } from 'engine/src/base/references';
import { 
  totalLand,
  totalUnits,
  totalNetPower,
  calcKingdomResistance,
} from 'engine/src/base/mage';
import { 
  maxSpellLevel,
  currentSpellLevel, 
  manaIncome,
  maxMana
} from 'engine/src/magic';

const mageStore = useMageStore();
const totalArmyPower = ref(0);
const { mage } = storeToRefs(mageStore);

const numItems = computed(() => {
  const keys = Object.keys(mage.value.items);
  let num = 0;
  keys.forEach(key => {
    num += mage.value.items[key];
  });
  return num;
});

const researchStatus = computed(() => {
  const mage = mageStore.mage;
  return Object.values(mage?.currentResearch as Object).filter(d => d && d.active === true);
});

const resistanceStatus = computed(() => {
  return calcKingdomResistance(mageStore.mage);
});

const armyUpkeepStatus = computed(() => {
  return armyUpkeep(mageStore.mage);
});

const buildingUpkeepStatus = computed(() => {
  return buildingUpkeep(mageStore.mage);
});

const unitsStatus = computed(() => {
  const result: any[] = [];
  if (!mageStore.mage) return []

  mageStore.mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    const stackPower = u.powerRank * stack.size;
    totalArmyPower.value += stackPower;

    const upkeep = {
      geld: Math.ceil(stack.size * u.upkeepCost.geld),
      mana: Math.ceil(stack.size * u.upkeepCost.mana),
      population: Math.ceil(stack.size * u.upkeepCost.population)
    };
    result.push({
      id: stack.id,
      name: u.name,
      upkeep,
      size: stack.size,
      power: stackPower
    });
  });

  return result;
});

</script>


<style scoped>
table {
  border: none;
}

td {
  border: none;
  min-width: 70px;
  padding: 0;
  padding-right: 10px;
}
</style>
