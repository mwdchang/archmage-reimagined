<template>
  <main v-if="report">
    <h3> Attacker #{{ report.attacker.id }} </h3>
    <table>
      <tr>
        <td>Name</td>
        <td># units</td>
        <td>Attack</td>
        <td>Extra</td>
        <td>Counter</td>
        <td>HP</td>
        <td>Accuracy</td>
      </tr>
      <tr v-for="(stack, idx) of report.attacker.army" :key="idx">
        <td>{{ stack.unit.name }}</td>
        <td>{{ stack.size }}</td>
        <td>{{ stack.unit.primaryAttackPower }}</td>
        <td>{{ stack.unit.secondaryAttackPower }}</td>
        <td>{{ stack.unit.counterAttackPower }}</td>
        <td>{{ stack.unit.hitPoints }}</td>
        <td>{{ stack.accuracy }}</td>
      </tr>
    </table>
    <br>

    <h3> Defender #{{ report.defender.id }} </h3>
    <table>
      <tr>
        <td>Name</td>
        <td># units</td>
        <td>Attack</td>
        <td>Extra</td>
        <td>Counter</td>
        <td>HP</td>
        <td>Accuracy</td>
      </tr>
      <tr v-for="(stack, idx) of report.defender.army" :key="idx">
        <td>{{ stack.unit.name }}</td>
        <td>{{ stack.size }}</td>
        <td>{{ stack.unit.primaryAttackPower }}</td>
        <td>{{ stack.unit.secondaryAttackPower }}</td>
        <td>{{ stack.unit.counterAttackPower }}</td>
        <td>{{ stack.unit.hitPoints }}</td>
        <td>{{ stack.accuracy }}</td>
      </tr>
    </table>
    <br>

    <h3>Spells and items</h3>
    <br>

    <h3>Assault</h3>
    <div v-for="(log, idx) of report.battleLogs" :key="idx">
      {{ log }}
    </div>
    <br>

    <h3>Assault Result</h3>

  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { API } from '@/api/api';

const props = defineProps<{ id: string }>(); 
const report = ref<any>(null);

onMounted(async () => {
  const res = (await API.get(`/report/${props.id}`)).data;
  report.value = res.report;
});

</script>
