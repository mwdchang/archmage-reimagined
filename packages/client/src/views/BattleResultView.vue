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
          <td>
            <router-link :to="{ name: 'viewUnit', params: { id: stack.unit.id }}"> 
              {{ stack.unit.name }}
            </router-link>
          </td>
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
          <td>
            <router-link :to="{ name: 'viewUnit', params: { id: stack.unit.id }}"> 
              {{ stack.unit.name }}
            </router-link>
          </td>
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
          {{ attackerStr }} casts 
          <router-link :to="{ name: 'viewSpell', params: { id: report.attacker.spellId }}">
            {{ readableStr(report.attacker.spellId) }}
          </router-link>
          <div v-if="preBattle.attacker.spellResult === 'barriers'">
            The spell hit barriers and fizzled.
          </div>
          <div v-if="preBattle.attacker.spellResult === 'noMana'">
            Not enough mana to cast the spell
          </div>
        </div>
        <div v-if="report.attacker.itemId">
          {{ attackerStr }} uses 
          <router-link :to="{ name: 'viewItem', params: { id: report.attacker.itemId }}">
            {{ readableStr(report.attacker.itemId) }}
          </router-link>
          <div v-if="preBattle.attacker.itemResult === 'barriers'">
            The item hit barriers and fizzled.
          </div>
        </div>
      </div>
      <div>
        <div v-if="report.defender.spellId">
          {{ defenderStr }} casts 
          <router-link :to="{ name: 'viewSpell', params: { id: report.defender.spellId }}">
            {{ readableStr(report.defender.spellId) }}
          </router-link>
          <div v-if="preBattle.defender.spellResult !== 'success'">
            Spell failed.
          </div>
        </div>
        <div v-if="report.defender.itemId">
          {{ defenderStr }} uses
          <router-link :to="{ name: 'viewItem', params: { id: report.defender.itemId }}">
           {{ readableStr(report.defender.itemId) }}
          </router-link>
          <div v-if="preBattle.defender.itemResult !== 'success'">
            Item failed.
          </div>
        </div>
      </div>
    <br>

    <h3 class="section-header">Assault</h3>
    <div v-for="(log, idx) of report.engagement.logs" :key="idx" class="br-row">
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
      <div v-if="checkGap(report.engagement.logs[idx], report.engagement.logs[idx+1])" style="margin-bottom: 0.5rem" />
    </div>
    <br>

    <h3 class="section-header">Assault Result</h3>
    <div v-for="(log, idx) of report.postBattle.unitSummary" :key="idx" class="br-row">
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
          {{ report.result.attacker.unitsLoss }} / {{ report.result.attacker.startingUnits }} units and
          {{ report.result.attacker.armyNetPowerLoss }} power
        </div>
      </div>
      <div>
        <div>Defender lost
          {{ report.result.defender.unitsLoss }} / {{ report.result.defender.startingUnits }} units and
          {{ report.result.defender.armyNetPowerLoss }} power
        </div>
      </div>
      <div>
        <div v-if="report.result.isSuccessful">
          {{ nameById(report.attacker.id) }}'s attack on {{ nameById(report.defender.id)}} was successful 
        </div>
        <div v-else>
          {{ nameById(report.attacker.id) }}'s attack on {{ nameById(report.defender.id)}} failed
        </div>
      </div>
      <!--
        {{ report.summary.attacker }}
        {{ report.summary.defender }}
      -->
    <br>

    <h3 class="section-header">Result</h3>
    <div v-if="report.attackType !== 'pillage'">
      Attacker gained {{ report.result.landGain }} acres and defender lost {{ report.result.landLoss }} acres
    </div>
    <div v-else>
      <div v-for="log of report.postBattle.logs">
        <div v-if="log.effectType === 'StealEffect'">
          {{ nameById(report.defender.id) }} lost {{ log.lossValue }} {{ log.target }}, 
          {{ nameById(report.attacker.id) }} pillaged {{ log.stealValue }} {{ log.target }}  
        </div>
      </div>
    </div>

  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import Magic from '@/components/magic.vue';
import { API } from '@/api/api';
import { readableStr } from '@/util/util';
import type { EngagementLog, BattleReport } from 'shared/types/battle';

const props = defineProps<{ id: string }>();
const report = ref<BattleReport|null>(null);

const preBattle = computed(() => {
  return report.value?.preBattle!;
});

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

// Make the battle report easier to read
const checkGap = (curr: EngagementLog | null, next: EngagementLog | null) => {
  if (curr && next) {
    if (next.type === 'counter') return false;
    return true;
  }
  return false;
}

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

p { line-height: 125% }

.br-row {
}
</style>
