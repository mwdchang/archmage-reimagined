<template>
  <main v-if="report">
    <h3 class="section-header"> Attacker #{{ report.attacker.id }} </h3>
    <table>
      <tr>
        <td>Name</td>
        <td>-</td>
        <td># units</td>
        <td>Attack</td>
        <td>Extra</td>
        <td>Counter</td>
        <td>HP</td>
        <td>Accuracy</td>
      </tr>
      <tr v-for="(stack, idx) of report.attacker.army" :key="idx">
        <td>{{ stack.unit.name }}</td>
        <td><magic :magic="stack.unit.magic" /></td>
        <td class="text-right">{{ stack.size }}</td>
        <td class="text-right">{{ stack.unit.primaryAttackPower }}</td>
        <td class="text-right">{{ stack.unit.secondaryAttackPower }}</td>
        <td class="text-right">{{ stack.unit.counterAttackPower }}</td>
        <td class="text-right">{{ stack.unit.hitPoints }}</td>
        <td class="text-right">{{ stack.accuracy }}</td>
      </tr>
    </table>
    <br>

    <h3 class="section-header"> Defender #{{ report.defender.id }} </h3>
    <table>
      <tr>
        <td>Name</td>
        <td>-</td>
        <td># units</td>
        <td>Attack</td>
        <td>Extra</td>
        <td>Counter</td>
        <td>HP</td>
        <td>Accuracy</td>
      </tr>
      <tr v-for="(stack, idx) of report.defender.army" :key="idx">
        <td>{{ stack.unit.name }}</td>
        <td><magic :magic="stack.unit.magic" /></td>
        <td class="text-right">{{ stack.size }}</td>
        <td class="text-right">{{ stack.unit.primaryAttackPower }}</td>
        <td class="text-right">{{ stack.unit.secondaryAttackPower }}</td>
        <td class="text-right">{{ stack.unit.counterAttackPower }}</td>
        <td class="text-right">{{ stack.unit.hitPoints }}</td>
        <td class="text-right">{{ stack.accuracy }}</td>
      </tr>
    </table>
    <br>

    <h3 class="section-header">Spells and items</h3>
    <div v-for="(log, idx) of report.preBattleLogs" :key="idx">
      {{ log }}
    </div>
    <br>

    <h3 class="section-header">Assault</h3>
    <div v-for="(log, idx) of report.battleLogs" :key="idx">
      {{ log }}
    </div>
    <br>

    <h3 class="section-header">Assault Result</h3>
    <div v-for="(log, idx) of report.postBattleLogs" :key="idx">
      {{ log }}
    </div>
    <br>

    <h3 class="section-header">Summary</h3>
    <div v-for="(log, idx) of report.summaryLogs" :key="idx">
      {{ log }}
    </div>
    <br>


    <router-link to="/about">Main</router-link>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Magic from '@/components/magic.vue';
import { API } from '@/api/api';

const props = defineProps<{ id: string }>(); 
const report = ref<any>(null);

onMounted(async () => {
  const res = (await API.get(`/report/${props.id}`)).data;
  report.value = res.report;
});

</script>

<style scoped>
td {
  padding: 0 5px;
}
td:nth-child(odd) {
  background: #202020;
}
td:nth-child(even) {
  background: #282828;
}
</style>
