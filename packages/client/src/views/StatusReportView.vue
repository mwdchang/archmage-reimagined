<template>
  <h2>Status Report</h2>
  <div class="section-header">General Info</div>
  <table v-if="mageStore.mage">
    <tr>
      <td>Rank</td>
      <td>???</td>
      <td>Power</td>
      <td>{{ totalNetPower(mageStore.mage) }} </td>
    </tr>
    <tr>
      <td>Land</td>
      <td>{{ totalLand(mageStore.mage) }}</td>
      <td>Fortress</td>
      <td>{{ mageStore.mage.fortresses }}</td>
    </tr>
    <tr>
      <td>Geld</td>
      <td>{{ mageStore.mage.currentGeld }}</td>
      <td>Items</td>
      <td>{{ mageStore.mage.items.length }}</td>
    </tr>
    <tr>
      <td>Units</td>
      <td>{{ totalUnits(mageStore.mage) }}</td>
      <td>Turns Left</td>
      <td>{{ mageStore.mage.currentTurn }}</td>
    </tr>
  </table>

  <div class="section-header">Spell Resistance</div>
  <table v-if="mageStore.mage">
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
  <table v-if="mageStore.mage">
    <tr>
      <td>Max Residential Space</td>
      <td>{{ maxPopulation(mageStore.mage) }}</td>
    </tr>
    <tr>
      <td>Food Production</td>
      <td>{{ maxFood(mageStore.mage) }}</td>
    </tr>
    <tr>
      <td>Max Population Available</td>
      <td>???</td>
    </tr>
    <tr>
      <td>Space for Units</td>
      <td>{{ spaceForUnits(mageStore.mage) }}</td>
    </tr>
    <tr>
      <td>Real Max Population</td>
      <td>???</td>
    </tr>
  </table>

  <div class="section-header">Interior Info</div>
    <table v-if="mageStore.mage">
      <tr>
        <td>&nbsp;</td>
        <td>Geld</td>
        <td>Mana</td>
        <td>Population</td>
      </tr>
      <tr>
        <td> Income </td>
        <td> {{ geldIncome(mageStore.mage) }} </td>
        <td> {{ manaIncome(mageStore.mage) }} </td>
        <td> {{ populationIncome(mageStore.mage) }} </td>
      </tr>
      <tr>
        <td> Unit upkeep </td>
        <td> {{ armyUpkeepStatus.geld }} </td>
        <td> {{ armyUpkeepStatus.mana }} </td>
        <td> {{ armyUpkeepStatus.population }} </td>
      </tr>
    </table>

  <div class="section-header">Building Info</div>
  <table v-if="mageStore.mage">
    <tr>
      <td> Land </td>
      <td> {{ totalLand(mageStore.mage) }} </td>
      <td> Wilderness </td>
      <td> {{ mageStore.mage.wilderness }} </td>
    </tr>
    <tr>
      <td>Farms</td>
      <td> {{ mageStore.mage.farms }} </td>
      <td>Towns</td>
      <td> {{ mageStore.mage.towns}} </td>
    </tr>
    <tr>
      <td>Workshops</td>
      <td> {{ mageStore.mage.workshops }} </td>
      <td>Barracks</td>
      <td> {{ mageStore.mage.barracks}} </td>
    </tr>
    <tr>
      <td>Nodes</td>
      <td> {{ mageStore.mage.nodes }} </td>
      <td>Library</td>
      <td> {{ mageStore.mage.libraries }} </td>
    </tr>
    <tr>
      <td>Fortress</td>
      <td> {{ mageStore.mage.fortresses }} </td>
      <td>Barriers</td>
      <td> {{ mageStore.mage.barriers }} </td>
    </tr>
  </table>

  <div class="section-header">Enchantments</div>
  <div class="section-header">Defence Assignment</div>
  <div class="section-header">Researching</div>
    <div v-if="mageStore.mage && researchStatus.length > 0">
      {{ researchStatus[0].id }}, {{ researchStatus[0].remainingCost }} points remaining
    </div>

  <div class="section-header">Recruiting</div>
  <div class="section-header">Skills</div>
  <div class="section-header">Units</div>
  <table v-if="mageStore.mage">
    <tr v-for="(u, _idx) of unitsStatus" :key="u.id">
      <td> {{ u.name }} </td>
      <td> {{ u.upkeep.geld }} / {{ u.upkeep.mana }} / {{ u.upkeep.population }} </td>
      <td class="text-right" style="padding-left: 10px"> {{ u.size }} </td>
      <td class="text-right"> {{ (100 * u.power / totalArmyPower).toFixed(2) }}%</td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMageStore } from '@/stores/mage';
import { 
  totalLand,
  totalUnits,
  maxPopulation,
  maxFood,
  spaceForUnits,
  totalNetPower,
  calcResistance,
  manaIncome,
  geldIncome,
  populationIncome,
  armyUpkeep
} from 'engine/src/interior';

import { getUnitById } from 'engine/src/army';

const mageStore = useMageStore();
const totalArmyPower = ref(0);

const researchStatus = computed(() => {
  const mage = mageStore.mage;
  return Object.values(mage?.currentResearch as Object).filter(d => d && d.active === true);
});

const resistanceStatus = computed(() => {
  return calcResistance(mageStore.mage);
});

const armyUpkeepStatus = computed(() => {
  return armyUpkeep(mageStore.mage);
});

const unitsStatus = computed(() => {
  const result: any[] = [];
  if (!mageStore.mage) return []

  mageStore.mage.army.forEach(stack => {
    const u = getUnitById(stack.id);
    const stackPower = u.powerRank * stack.size;
    totalArmyPower.value += stackPower;

    const upkeep = {
      geld: stack.size * u.upkeepCost.geld,
      mana: stack.size * u.upkeepCost.mana,
      population: stack.size * u.upkeepCost.population
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
.section-header {
  color: #F80
}

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
