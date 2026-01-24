<template>
  <main>
    <div class="section-header row" style="margin-bottom: 0.5rem">
      <magic :magic="mageSummary.magic" />
      {{ mageSummary.name }} (#{{ mageSummary.id }}) 
    </div>

    <table style="min-width: 20rem" v-if="mageSummary.id">
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
          <td>Chronicles</td>
          <td>
            <div class="row" style="padding: 0 1rem; justify-content: space-between; gap: 1.0rem">
              <router-link :to="{ name: 'chronicles', query: { targetId: mageSummary.id, window: 1 } }">
                1H
              </router-link>
              <router-link :to="{ name: 'chronicles', query: { targetId: mageSummary.id, window: 24 } }">
                24H
              </router-link>
              <router-link :to="{ name: 'chronicles', query: { targetId: mageSummary.id, window: 48 } }"> 
                48H
              </router-link>
              <router-link :to="{ name: 'chronicles', query: { targetId: mageSummary.id, window: 72 } }"> 
                72H
              </router-link>
            </div>
          </td>
        </tr>
        <tr v-if="mageStore.mage!.id !== mageId"> 
          <td>Action</td>
          <td>
            <div class="row" style="padding: 0 1rem; gap: 1.0rem">
              <router-link 
                :to="{ name: 'spell', query: { targetId: mageSummary.id }}">
                Magic 
              </router-link>
              <router-link 
                :to="{ name: 'item', query: { targetId: mageSummary.id }}">
                Item
              </router-link>
            </div>
          </td>
        </tr>
        <tr v-if="mageStore.mage!.id !== mageId"> 
          <td>Attack</td>
          <td> 
            <div class="row" style="padding: 0 1rem; justify-content: space-between; gap: 1.0rem">
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
  </main>
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

<style scoped>
</style>
