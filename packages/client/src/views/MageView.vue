<template>
  <div class="section-header row">
    <magic :magic="mageSummary.magic" />
    {{ mageSummary.name }} (#{{ mageSummary.id }}) 
  </div>
  <table v-if="mageSummary.id">
    <tbody>
      <tr>
        <td>Specialty</td>
        <td class="text-right">
          <div>{{ readableStr(mageSummary.magic) }} </div>
        </td>
      </tr>
      <tr>
        <td>Rank</td>
        <td class="text-right">{{ mageSummary.rank }}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td class="text-right">{{ mageSummary.status }}</td>
      </tr>
      <tr>
        <td>Power</td>
        <td class="text-right">{{ readableNumber(mageSummary.netPower) }} </td>
      </tr>
      <tr>
        <td>Land</td>
        <td class="text-right">{{ readableNumber(mageSummary.land) }} </td>
      </tr>
      <tr>
        <td>Forts</td>
        <td class="text-right">{{ mageSummary.forts }} </td>
      </tr>
      <tr>
        <td>Attack</td>
        <td class="text-right">
          <div class="row" v-if="mageStore.mage!.id !== mageId" style="gap: 8px">
            <router-link 
              :to="{ name: 'battlePrep', params: { targetId: mageSummary.id, battleType: 'siege' }}">
              Siege
            </router-link>
            <router-link 
              :to="{ name: 'battlePrep', params: { targetId: mageSummary.id, battleType: 'regular' }}">
              Regular
            </router-link>
            <router-link 
              :to="{ name: 'battlePrep', params: { targetId: mageSummary.id, battleType: 'pillage' }}">
              Pillage
            </router-link>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import magic from '@/components/magic.vue';
import { useMageStore } from '@/stores/mage';
import { API } from '@/api/api';
import { readableNumber, readableStr } from '@/util/util';

const mageStore = useMageStore();

const props = defineProps<{ 
  mageId: number | string
}>(); 

const mageSummary = ref<any>({});

onMounted(async () => {
  const m = (await API.get(`mage/${props.mageId}`)).data;
  mageSummary.value = m.mageSummary;
});

</script>
