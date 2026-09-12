<template>
  <main>
    <div class="flex flex-row items-center gap-[5px] w-[35rem] max-w-full mb-2">
      <ImageProxy src="/images/ui/recruit.png" />
      <div>
        <div class="section-header">Recruitment</div>
        <div>
          You can recruit troops here, build more barracks to increase the recruitment rates.
          Be cautious as troops take up gelds and living-spaces.
        </div>
      </div>
    </div>

    <section class="flex flex-row items-start gap-2 mt-[10px]">
      <!-- left -->
      <table v-if="mageStore.mage && layout === 'table'">
        <tbody>
          <tr>
            <td> Name </td>
            <!--<td> Cost </td> -->
            <td> Upkeep </td>
            <td> Max/Turn </td>
          </tr>
          <tr v-for="(unit) of recruitableUnits">
            <td> 
              <router-link :to="{ name: 'viewUnit', params: { id: unit.id }}"> {{ unit.name }} </router-link>
            </td>
            <!--
            <td class="text-right"> {{ resourceDisplay(unit.recruitCost) }} </td>
            -->
            <td class="text-right"> {{ resourceDisplay(unit.upkeepCost) }} </td>
            <td class="text-right"> {{ readableNumber(recruitmentAmount(mageStore.mage, unit.id)) }} </td>
          </tr>
        </tbody>
      </table>
      <div v-if="mageStore.mage && layout === 'cards'">
        <div class="rounded border border-[#333] bg-[#181818] m-2 p-2" v-for="(unit) of recruitableUnits">
          <router-link :to="{ name: 'viewUnit', params: { id: unit.id }}"> {{ unit.name }} </router-link>
          <div class="grid grid-cols-[1fr_2fr] gap-x-4">
            <div>Upkeep</div>
            <div>{{ resourceDisplay(unit.upkeepCost) }} </div>
            <div>Max/Turn</div>
            <div>{{ readableNumber(recruitmentAmount(mageStore.mage, unit.id)) }} </div>
          </div>
        </div>
      </div>
        

      <!-- right -->
      <div>
        <section class="form w-[22rem]">
          <label>Recruit units</label> 

          <div class="flex flex-row items-center gap-[5px]">
            <select v-model="rselect">
              <option v-for="unit of recruitableUnits" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
            </select>
            <input type="number" v-model="rsize" size="8" @keyup.enter="addOrder" >
          </div>

          <button @click="addOrder">Add</button>
          <div v-if="errorStr" class="text-[#e41] bg-[#200]">{{ errorStr }}</div>

          <!-- current recruitment -->
          <table class="mt-2"> 
            <tr v-for="(r, idx) of currentRecruitments" :key="r.id">
              <td class="min-w-[8rem]">
                {{ readableStr(r.id) }}
              </td>
              <td class="text-right">{{ readableNumber(r.size) }}</td>
              <td> 
                <div class="flex flex-row items-center gap-1 text-[0.8rem]">
                  <svg-icon class="cursor-pointer hover:text-[#aaaaee] hover:bg-[#444444]" name="remove" size="1.10rem" @click="deleteOrder(idx)" />
                  <div>|</div>
                  <svg-icon class="cursor-pointer hover:text-[#aaaaee] hover:bg-[#444444]" name="doubleCaretUp" size="1.25rem" @click="moveTop(idx)" />
                  <div>|</div>
                  <svg-icon class="cursor-pointer hover:text-[#aaaaee] hover:bg-[#444444]" name="caretUp" size="1.25rem" @click="moveUp(idx)" />
                  <div>|</div>
                  <svg-icon class="cursor-pointer hover:text-[#aaaaee] hover:bg-[#444444]" name="caretDown" size="1.25rem" @click="moveDown(idx)" />
                  <div>|</div>
                  <svg-icon class="cursor-pointer hover:text-[#aaaaee] hover:bg-[#444444]" name="doubleCaretDown" size="1.25rem" @click="moveBottom(idx)" />
                </div>
              </td>
            </tr>
          </table>
        </section>
      </div>
    </section>
  </main>
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
import { readableStr, readableNumber } from '@/util/util';
import SvgIcon from '@/components/svg-icon.vue';
import ImageProxy from '@/components/ImageProxy.vue';
import { useLayout } from '@/composables/useLayout';

const mageStore = useMageStore();
const { layout } = useLayout();

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

const moveUp = (idx: number) => {
  if (idx > 0) {
    const temp = currentRecruitments.value[idx];
    currentRecruitments.value[idx] = currentRecruitments.value[idx - 1]; 
    currentRecruitments.value[idx - 1] = temp;
    update();
  }
}

const moveDown = (idx: number) => {
  if (idx < currentRecruitments.value.length - 1) {
    const temp = currentRecruitments.value[idx];
    currentRecruitments.value[idx] = currentRecruitments.value[idx + 1]; 
    currentRecruitments.value[idx + 1] = temp;
    update();
  }
}

const moveTop = (idx: number) => {
  if (idx > 0) {
    const temp = currentRecruitments.value[idx];
    currentRecruitments.value.splice(idx, 1);
    currentRecruitments.value.unshift(temp);
    update();
  }
}

const moveBottom = (idx: number) => {
  if (idx < currentRecruitments.value.length - 1) {
    const temp = currentRecruitments.value[idx];
    currentRecruitments.value.splice(idx, 1);
    currentRecruitments.value.push(temp);
    update();
  }
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
