<template>
  <div class="section-header">Disband Units</div>
  <table v-if="mageStore.mage">
    <tbody>
      <tr>
        <td> Name </td>
        <td> Upkeep </td>
        <td> Number </td>
        <td> Power </td>
        <td> &nbsp; </td>
        <td> &nbsp; </td>
        <td> Disband </td>
      </tr>
      <tr v-for="(u) of unitsStatus" :key="u.id">
        <td> 
          <router-link :to="{ name: 'viewUnit', params: { id: u.id }}"> {{ u.name }} </router-link>
        </td>
        <td class="text-right"> {{ u.upkeep.geld }} / {{ u.upkeep.mana }} / {{ u.upkeep.population }} </td>
        <td class="text-right" style="padding-left: 10px"> {{ u.size }} </td>
        <td class="text-right"> {{ (100 * u.powerPercentage).toFixed(2) }}%</td>
        <td class="text-right" style="font-size: 75%"> 
          +{{ u.moveUp }}
        </td>
        <td class="text-right" style="font-size: 75%"> 
          -{{ u.moveDown }}
        </td>
        <td>
          <input type="text" size=12 v-model="disbandPayload[u.id]">
        </td>
      </tr>
    </tbody>
  </table>
  <br/>

  <section class="form">
    <div class="row" style="align-items: baseline">
      <input type="checkbox" v-model="confirmDisband" style="width:15px; height:15px"> 
      <label>Disband confirmation&nbsp;</label>
    </div>

    <button @click="disbandUnits()" :disabled="confirmDisband === false">Disband units</button>
  </section>

</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { API } from '@/api/api';
import { useMageStore } from '@/stores/mage';
import { getArmy, ArmyItem } from '@/util/util';
import { getUnitById } from 'engine/src/base/references';
import { npMultiplier } from 'engine/src/base/unit';


interface DisbandArmyItem extends ArmyItem {
  moveUp: number;
  moveDown: number;
  disbandAmount: number;
};

const mageStore = useMageStore();

const confirmDisband = ref(false);

const disbandPayload = ref<{[key: string]: number }>({});

const unitsStatus = computed<DisbandArmyItem[]>(() => {
  if (!mageStore.mage) return []
  let rawArmy = getArmy(mageStore.mage);

  const armyItems = rawArmy.sort((a, b) => b.power - a.power);

  return armyItems.map((armyItem, index) => {
    let moveUp = 0;
    let moveDown = 0;

    // amount of units to move up
    if (index > 0) { 
      const unitToAdjust = getUnitById(armyItems[index].id);
      const power = Math.abs(armyItems[index - 1].power - armyItems[index].power);
      const multiplier = npMultiplier(unitToAdjust);
      const num = Math.ceil(power / (multiplier * unitToAdjust.powerRank));
      moveUp = num;
    }

    // amount of units to move down
    if (index < armyItems.length - 1) {
      const unitToAdjust = getUnitById(armyItems[index].id);
      const power = Math.abs(armyItems[index].power - armyItems[index + 1].power);
      const multiplier = npMultiplier(unitToAdjust);
      const num = Math.ceil(power / (multiplier * unitToAdjust.powerRank));
      moveDown = num;
    }

    console.log(armyItem.id, moveUp, moveDown);
    
    return {
      ...armyItem,
      moveUp: moveUp,
      moveDown: moveDown,
      disbandAmount: 0
    };
  });
});

const disbandUnits = async () => {
  const payload: any = {};
  Object.keys(disbandPayload.value).forEach(k => {
    if (disbandPayload.value[k] > 0) {
      payload[k] = {
        id: k,
        size: +disbandPayload.value[k]
      };
    }
  });

  const res = await API.post('/disband', { disbands: payload });
  mageStore.setMage(res.data.mage);
};

watch(
  () => mageStore.mage,
  () => {
    if (!mageStore.mage) return;
    mageStore.mage!.army.forEach(d => {
      disbandPayload.value[d.id] = 0;
    });
  }
);

</script>

<style>
</style>
