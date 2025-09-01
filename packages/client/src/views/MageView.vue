<template>
  <div>Lookup a Mage </div>
  <table>
    <tbody>
      <tr>
        <td>Country</td><td>{{ mageSummary.name }} (#{{ mageSummary.id }}) </td>
      </tr>
      <tr>
        <td>Magic</td>
        <td>
          <div style="display: flex">
          <magic :magic="mageSummary.magic" />{{ mageSummary.magic }} 
          </div>
        </td>
      </tr>
      <tr>
        <td>Power</td><td class="text-right">{{ readbleNumber(mageSummary.netPower) }} </td>
      </tr>
      <tr>
        <td>Land</td><td class="text-right">{{ readbleNumber(mageSummary.land) }} </td>
      </tr>
      <tr>
        <td>Forts</td><td class="text-right">{{ mageSummary.forts }} </td>
      </tr>
      <tr>
        <td>Attack</td>
        <td class="text-right">
          <router-link 
            v-if="mageStore.mage!.id !== mageId"
            :to="{ name: 'battle', query: { targetId: mageSummary.id }}">
            Siege
          </router-link>
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
import { readbleNumber } from '@/util/util';

const mageStore = useMageStore();

const props = defineProps<{ mageId: number}>(); 

const mageSummary = ref<any>({});

onMounted(async () => {
  const m = (await API.get(`mage/${props.mageId}`)).data;
  mageSummary.value = m.mageSummary;
});

</script>
