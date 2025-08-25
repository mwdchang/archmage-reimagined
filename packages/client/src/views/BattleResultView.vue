<template>
  <main v-if="report">
    <h3 class="section-header"> Attacker {{ attackerStr }} </h3>
    <table>
      <tbody>
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
          <td><magic :magic="stack.unit.magic" small /></td>
          <td class="text-right">{{ stack.size }}</td>
          <td class="text-right">{{ stack.unit.primaryAttackPower }}</td>
          <td class="text-right">{{ stack.unit.secondaryAttackPower }}</td>
          <td class="text-right">{{ stack.unit.counterAttackPower }}</td>
          <td class="text-right">{{ stack.unit.hitPoints }}</td>
          <td class="text-right">{{ stack.accuracy }}</td>
        </tr>
      </tbody>
    </table>
    <br>

    <h3 class="section-header"> Defender {{ defenderStr }} </h3>
    <table>
      <tbody>
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
          <td><magic :magic="stack.unit.magic" small /></td>
          <td class="text-right">{{ stack.size }}</td>
          <td class="text-right">{{ stack.unit.primaryAttackPower }}</td>
          <td class="text-right">{{ stack.unit.secondaryAttackPower }}</td>
          <td class="text-right">{{ stack.unit.counterAttackPower }}</td>
          <td class="text-right">{{ stack.unit.hitPoints }}</td>
          <td class="text-right">{{ stack.accuracy }}</td>
        </tr>
      </tbody>
    </table>
    <br>

    <h3 class="section-header">Spells and items</h3>
      <div>
        <div v-if="report.attacker.spellId">
          {{ attackerStr }} casts {{ report.attacker.spellId }}
          <span v-if="report.preBattle.attacker.spellResult !== 'success'">
          &nsp; spell failed.
          </span>
        </div>
        <div v-if="report.attacker.itemId">
          {{ attackerStr }} uses {{ report.attacker.itemId }}
          <span v-if="report.preBattle.attacker.itemResult !== 'success'">
          &nsp; item failed.
          </span>
        </div>
      </div>
      <div>
        <div v-if="report.defender.spellId">
          {{ defenderStr }} casts {{ report.defender.spellId }}
          <span v-if="report.preBattle.defender.spellResult !== 'success'">
          &nsp; spell failed.
          </span>
        </div>
        <div v-if="report.defender.itemId">
          {{ defenderStr }} uses {{ report.defender.itemId }}
          <span v-if="report.preBattle.defender.itemResult !== 'success'">
          &nsp; item failed.
          </span>
        </div>
      </div>
    <br>

    <h3 class="section-header">Assault</h3>
    <div v-for="(log, idx) of report.battleLogs" :key="idx" class="br-row">
      <!--{{ log }}-->
      <div v-if="log.type === 'primary' || log.type === 'secondary'">
        <p>
          {{ nameById(log.attacker.id) }}'s {{ log.attacker.unitId }} attacks
          {{ nameById(log.defender.id) }}'s {{ log.defender.unitId }}
        </p>
        <p>
          {{ nameById(log.attacker.id) }}'s {{ log.attacker.unitId }} slew
          {{ nameById(log.defender.id) }}'s {{ log.defender.unitsLoss }} {{ log.defender.unitId }}
        </p>
        <p v-if="log.attacker.unitsLoss < 0">
          {{ nameById(log.attacker.id) }} created {{ Math.abs(log.attacker.unitsLoss) }} {{ log.attacker.unitId }}
        </p>
      </div>
      <div v-if="log.type === 'additionalStrike'">
        <p>
          {{ nameById(log.attacker.id) }}'s {{ log.attacker.unitId }} attacks
          {{ nameById(log.defender.id) }}'s {{ log.defender.unitId }} again
        </p>
        <p>
          {{ nameById(log.attacker.id) }}'s {{ log.attacker.unitId }} slew
          {{ nameById(log.defender.id) }}'s {{ log.defender.unitsLoss }} {{ log.defender.unitId }}
        </p>
        <p v-if="log.attacker.unitsLoss < 0">
          {{ nameById(log.attacker.id) }} created {{ Math.abs(log.attacker.unitsLoss) }} {{ log.attacker.unitId }}
        </p>
      </div>
      <div v-if="log.type === 'counter'">
        <p>
          {{ nameById(log.defender.id) }}'s {{ log.defender.unitId }} struck back at
          {{ nameById(log.attacker.id) }}'s {{ log.attacker.unitId }}
        </p>
        <p>
          {{ nameById(log.defender.id) }}'s {{ log.defender.unitId }} slew
          {{ nameById(log.attacker.id) }}'s {{ log.attacker.unitsLoss }} {{ log.attacker.unitId }}
        </p>
        <p v-if="log.defender.unitsLoss < 0">
          {{ nameById(log.defender.id) }} created {{ Math.abs(log.defender.unitsLoss) }} {{ log.defender.unitId }}
        </p>
      </div>
      <div v-if="log.type.startsWith('burst')">
        <p>
          {{ log.type }} from {{ nameById(log.defender.id) }}'s {{ log.defender.unitId }} slew
          {{ nameById(log.attacker.id) }} {{ log.attacker.unitsLoss }} {{ log.attacker.unitId }}
        </p>
        <p>
          {{ log.type }} from {{ nameById(log.defender.id) }}'s {{ log.defender.unitId }} slew
          {{ nameById(log.defender.id) }} {{ log.defender.unitsLoss }} {{ log.defender.unitId }}
        </p>
      </div>
    </div>
    <br>

    <h3 class="section-header">Assault Result</h3>
    <div v-for="(log, idx) of report.postBattleLogs" :key="idx" class="br-row">
      <!--{{ log }}-->
      <p>
        {{ nameById(log.id) }}'s {{ log.unitsLoss }} {{ log.unitId }} were slain in battle
      </p>
      <p>
        {{ nameById(log.id) }}'s {{ log.unitsHealed }} {{ log.unitId }} resurrected
      </p>
    </div>
    <br>

    <h3 class="section-header">Summary</h3>
      <div>
        <div>Attacker lost
          {{ report.summary.attacker.unitsLoss }} / {{ report.summary.attacker.startingUnits }} units and
          {{ report.summary.attacker.netPowerLoss }} power
        </div>
      </div>
      <div>
        <div>Defender lost
          {{ report.summary.defender.unitsLoss }} / {{ report.summary.defender.startingUnits }} units and
          {{ report.summary.defender.netPowerLoss }} power
        </div>

      </div>
      <!--
        {{ report.summary.attacker }}
        {{ report.summary.defender }}
      -->
    <br>

    <h3 class="section-header">Result</h3>
      <div>
      Attacker gained {{ report.summary.landGain }} acres and defender lost {{ report.summary.landLoss }} acres
      </div>
      <!--
      <div>{{ report.summary }} </div>
      <div>{{ report.isSuccessful }}</div>
      <div>{{ report.landResult }}</div>
      -->
    <br>

  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import Magic from '@/components/magic.vue';
import { API } from '@/api/api';
import type { BattleReport } from 'shared/types/battle';

const props = defineProps<{ id: string }>();
const report = ref<BattleReport|null>(null);

const attackerStr = computed(() => {
  if (!report.value) return '';
  return `${report.value.attacker.name} (#${report.value.attacker.id})`;
});

const defenderStr = computed(() => {
  if (!report.value) return '';
  return `${report.value.defender.name} (#${report.value.defender.id})`;
});

const nameById = (id: number) => {
  if (!report.value) return '';
  if (id === report.value.attacker.id) {
    return attackerStr;
  }
  return defenderStr;
};

onMounted(async () => {
  const res = (await API.get<{ report: BattleReport}>(`/report/${props.id}`)).data;
  report.value = res.report;

  // const m = (await API.get(`mage/${props.mageId}`)).data;
  // mageSummary.value = m.mageSummary;
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

.br-row {
  margin-bottom: 8px;
}
</style>
