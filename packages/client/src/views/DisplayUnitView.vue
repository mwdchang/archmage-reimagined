<template>
  <h2 v-if="unit" class="row">
    <magic :magic="unit.magic" />{{unit.name}}
  </h2>
  <p style="margin: 1rem 10rem; line-height: 120%" v-if="unit">{{ unit.description }} </p>
  <main v-if="unit">
    <table>
      <tbody>
        <tr style="background: #333">
          <td colspan="2">Unit Statistics</td>
        </tr>

        <tr style="border-top: solid 2px #555">
          <td>Name</td>
          <td>{{ unit.name }}</td>
        </tr>
        <tr>
          <td>Magic</td>
          <td>{{ unit.magic }}</td>
        </tr>
        <tr>
          <td>Race</td>
          <td>{{ unit.race.join(' ') }}</td>
        </tr>
        <tr>
          <td>Attributes</td>
          <td>{{ unit.attributes.join(' ') }}</td>
        </tr>
        <tr>
          <td>Power Rank</td>
          <td class="text-right">{{ unit.powerRank }}</td>
        </tr>

        <tr style="border-top: solid 2px #555">
          <td>Attack Power</td>
          <td class="text-right">{{ unit.primaryAttackPower }}</td>
        </tr>
        <tr>
          <td>Attack Type</td>
          <td>{{ unit.primaryAttackType.join(' ') }}</td>
        </tr>
        <tr>
          <td>Attack Initiative</td>
          <td class="text-right">{{ unit.primaryAttackInit }}</td>
        </tr>
        <tr>
          <td>Counter Power</td>
          <td class="text-right">{{ unit.counterAttackPower}}</td>
        </tr>

        <tr style="border-top: solid 2px #555">
          <td>Extra Attack Power</td>
          <td class="text-right">{{ unit.secondaryAttackPower }}</td>
        </tr>
        <tr>
          <td>Extra Attack Type</td>
          <td>{{ unit.secondaryAttackType.join(' ') }}</td>
        </tr>
        <tr>
          <td>Extra Attack Initiative</td>
          <td class="text-right">{{ unit.secondaryAttackInit }}</td>
        </tr>

        <tr style="border-top: solid 2px #555">
          <td>Hit Points</td>
          <td class="text-right">{{ unit.hitPoints }}</td>
        </tr>
        <tr>
          <td>Recruiting Cost</td>
          <td>
            {{ unit.recruitCost.geld }} geld, {{ unit.recruitCost.mana }} MP, {{ unit.recruitCost.population }} pop
          </td>
        </tr>
        <tr>
          <td>Upkeep Cost</td>
          <td>
            {{ unit.upkeepCost.geld }} geld, {{ unit.upkeepCost.mana }} MP, {{ unit.upkeepCost.population }} pop
          </td>
        </tr>

        <tr style="border-top: solid 2px #555">
          <td>Abilities</td>
          <td> 
            <div v-for="(ability, idx) of unit.abilities" :key="idx">
              {{ readableStr(ability.name) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div style="width: 2rem">&nbsp;</div>

    <table>
      <tbody>
        <tr style="background: #333; border-bottom: solid 2px #555">
          <td colspan="2">Spell Resistances</td>
        </tr>
        <tr v-for="(magic) of allowedMagicList" :key="magic">
          <td>{{ readableStr(magic) }}</td>
          <td class="text-right">{{ unit.spellResistances[magic] }}</td>
        </tr>

        <tr style="background: #333">
          <td colspan="2">Attack Resistances</td>
        </tr>
        <tr style="border-top: solid 2px #555">
          <td>Missile</td>
          <td class="text-right">{{ unit.attackResistances.missile }}</td>
        </tr>
        <tr> 
          <td>Fire</td>
          <td class="text-right">{{ unit.attackResistances.fire }}</td>
        </tr>
        <tr> 
          <td>Poison</td>
          <td class="text-right">{{ unit.attackResistances.poison }}</td>
        </tr>
        <tr> 
          <td>Breath</td>
          <td class="text-right">{{ unit.attackResistances.breath }}</td>
        </tr>
        <tr> 
          <td>Magic</td>
          <td class="text-right">{{ unit.attackResistances.magic }}</td>
        </tr>
        <tr> 
          <td>Melee</td>
          <td class="text-right">{{ unit.attackResistances.melee }}</td>
        </tr>
        <tr> 
          <td>Ranged</td>
          <td class="text-right">{{ unit.attackResistances.ranged }}</td>
        </tr>
        <tr> 
          <td>Lightning</td>
          <td class="text-right">{{ unit.attackResistances.lightning }}</td>
        </tr>
        <tr> 
          <td>Cold</td>
          <td class="text-right">{{ unit.attackResistances.cold }}</td>
        </tr>
        <tr> 
          <td>Paralyse</td>
          <td class="text-right">{{ unit.attackResistances.paralyse }}</td>
        </tr>
        <tr> 
          <td>Psychic</td>
          <td class="text-right">{{ unit.attackResistances.psychic }}</td>
        </tr>
        <tr> 
          <td>Holy</td>
          <td class="text-right">{{ unit.attackResistances.holy }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUnitById } from 'engine/src/base/references';
import { Unit } from 'shared/types/unit';
import { readableStr } from '@/util/util';
import Magic from '@/components/magic.vue';
import { allowedMagicList } from 'shared/src/common';

const props = defineProps<{ id: string }>(); 

const unit = ref<Unit|null>(null);

onMounted(() => {
  unit.value = getUnitById(props.id);
});
</script>

<style scoped>
main {
  display: flex;
  flex-direction: row;
}

</style>
