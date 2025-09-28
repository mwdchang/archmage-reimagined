<template>
  <div class="section-header">Recruitment</div>
  <table v-if="mageStore.mage">
    <tbody>
      <tr>
        <td> Name </td>
        <td> Cost </td>
        <td> Upkeep </td>
        <td> Max/Turn </td>
      </tr>
      <tr v-for="(unit) of recruitableUnits">
        <td> 
          <router-link :to="{ name: 'viewUnit', params: { id: unit.id }}"> {{ unit.name }} </router-link>
        </td>
        <td class="text-right"> {{ resourceDisplay(unit.recruitCost) }} </td>
        <td class="text-right"> {{ resourceDisplay(unit.upkeepCost) }} </td>
        <td class="text-right"> {{ recruitmentAmount(mageStore.mage, unit.id) }} </td>
      </tr>
    </tbody>
  </table>

  <br>
  <section class="form" style="width: 25rem">
    <label>Recruit units</label> 

    <div class="row">
      <select v-model="rselect">
        <option v-for="unit of recruitableUnits" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
      </select>
      <input type="number" v-model="rsize" size="8">
    </div>

    <button @click="addOrder">Add</button>
  </section>
  <div v-if="errorStr" class="error">{{ errorStr }}</div>
  <br>

  <table>
    <tr v-for="(r, idx) of currentRecruitments" :key="r.id">
      <td>
        {{ readableStr(r.id) }}
      </td>
      <td>{{ r.size }}</td>
      <td> <button @click="deleteOrder(idx)">Remove</button></td>
    </tr>
  </table>

</template>

<script setup lang="ts">
import _ from 'lodash';
import { API, APIWrapper } from '@/api/api';
import { ref, onMounted } from 'vue';
import { Unit } from 'shared/types/unit';
import { useMageStore } from '@/stores/mage';
import { getRecruitableUnits } from 'engine/src/base/references'; 
import { recruitmentAmount } from 'engine/src/interior';
import { ArmyUnit } from 'shared/types/mage';
import { readableStr } from '@/util/util';

const mageStore = useMageStore();

const rselect = ref(''); // Selected unit
const rsize = ref(0);    // Recruitment size
const currentRecruitments = ref<ArmyUnit[]>([]);
const errorStr = ref('');

const recruitableUnits = ref<Unit[]>([]);
recruitableUnits.value = getRecruitableUnits(mageStore.mage!.magic);

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
  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post('recruitments', {
      recruitments: currentRecruitments.value
    });
  });

  if (error) {
    errorStr.value = error;
  }

  if (data) {
    mageStore.setMage(data.mage);
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
