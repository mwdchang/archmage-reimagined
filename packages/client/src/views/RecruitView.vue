<template>
  <div>Recruitment</div>
  <table v-if="mageStore.mage">
    <tr>
      <td> Name </td>
      <td> Cost </td>
      <td> Upkeep </td>
      <td> Max/Turn </td>
    </tr>
    <tr v-for="(unit) of recruitableUnits">
      <td> {{ unit.name }} </td>
      <td class="text-right"> {{ resourceDisplay(unit.recruitCost) }} </td>
      <td class="text-right"> {{ resourceDisplay(unit.upkeepCost) }} </td>
      <td class="text-right"> {{ recruitmentAmount(mageStore.mage, unit.id) }} </td>
    </tr>
  </table>
  <br>
  <div class="row">
    <label>Recruit&nbsp;</label> 
    <select v-model="rselect">
      <option v-for="unit of recruitableUnits" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
    </select>
    &nbsp;
    <input type="text" v-model="rsize" size="8">
    &nbsp;
    <button @click="addOrder">Add</button>
  </div>
  <br>
  <table>
    <tr v-for="(r, idx) of currentRecruitments" :key="r.id">
      <td>{{ r.id }}</td>
      <td>{{ r.size }}</td>
      <td> <button @click="deleteOrder(idx)">Remove</button></td>
    </tr>
  </table>

</template>

<script setup lang="ts">
import _ from 'lodash';
import { API } from '@/api/api';
import { ref, onMounted } from 'vue';
import { Unit } from 'shared/types/unit';
import { useMageStore } from '@/stores/mage';
import { getRecruitableUnits } from 'engine/src/base/references'; 
import { recruitmentAmount } from 'engine/src/interior';
import { ArmyUnit } from 'shared/types/mage';

const mageStore = useMageStore();

const rselect = ref(''); // Selected unit
const rsize = ref(0);    // Recruitment size
const currentRecruitments = ref<ArmyUnit[]>([]);

const recruitableUnits = ref<Unit[]>([]);
recruitableUnits.value = getRecruitableUnits('ascendant');

const resourceDisplay = (v: any) => {
  return `${v.geld.toFixed(2)}/${v.mana.toFixed(2)}/${v.population.toFixed(2)}`;
};

const addOrder = () => {
  const v = +rsize.value;
  if (v <= 0) return;

  currentRecruitments.value.push({
    id: rselect.value,
    size: +rsize.value
  });
  update();
}

const deleteOrder = (idx: number) => {
  currentRecruitments.value.splice(idx, 1);
  update();
}

const update = async () => {
  const res = await API.post('recruitments', {
    recruitments: currentRecruitments.value
  });

  if (res.data.mage) {
    mageStore.setMage(res.data.mage);
  }
}

onMounted(() => {
  rselect.value = recruitableUnits.value[0].id;
  if (mageStore.mage && mageStore.mage.recruitments) {
    currentRecruitments.value = _.cloneDeep(mageStore.mage.recruitments);
  } else {
    currentRecruitments.value = [];
  }
});

</script>

<style scoped>
.row {
  display: flex;
}
</style>
