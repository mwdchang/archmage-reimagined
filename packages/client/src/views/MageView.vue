<template>
  <div>Lookup a Mage </div>
  <table>
    <tr>
      <td>Country</td><td>{{ mageSummary.name }} (# {{ mageSummary.id }}) </td>
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
      <td>Power</td><td>{{ mageSummary.netPower }} </td>
    </tr>
    <tr>
      <td>Land</td><td>{{ mageSummary.land }} </td>
    </tr>
    <tr>
      <td>Forts</td><td>{{ mageSummary.forts }} </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import magic from '@/components/magic.vue';
import { API } from '@/api/api';

const props = defineProps({
  mageId: String
});

const mageSummary = ref<any>({});

onMounted(async () => {
  const m = (await API.get(`mage/${props.mageId}`)).data;
  mageSummary.value = m.mageSummary;
});

</script>
