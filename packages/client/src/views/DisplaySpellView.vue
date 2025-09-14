<template>
  <h2 v-if="spell" class="row">
    <magic :magic="spell.magic" />{{spell.name}}
  </h2>
  <main v-if="spell">
    <p style="margin: 1rem 1rem">{{ spell.description }} </p>
    <table>
      <tbody>
        <tr>
          <td> Rank </td>
          <td> {{ spell.rank }}</td>
        </tr>
        <tr>
          <td> Casting cost </td>
          <td> {{ spell.castingCost }} </td>
        </tr>
        <tr>
          <td> Casting turn </td>
          <td> {{ spell.castingTurn }} </td>
        </tr>
        <tr>
          <td> Research cost </td>
          <td> {{ spell.researchCost }} </td>
        </tr>
        <tr>
          <td> Atrributes </td>
          <td> {{ spell.attributes.join(",&nbsp;") }} </td>
        </tr>
        <tr v-if="spell.upkeep">
          <td> Upkeep </td>
          <td>
            <div> {{ spell.upkeep.geld }} geld </div>
            <div> {{ spell.upkeep.mana }} mana</div>
            <div> {{ spell.upkeep.population }} population</div>
          </td>
        </tr>
      </tbody>
    </table>

    <div style="width:100%; border-bottom: 1px solid #888">&nbsp;</div>
    <p v-for="(effect, idx) in spell.effects" :key="idx">
      <SummonEffect v-if="effect.effectType === 'UnitSummonEffect'" :effect="effect as any" />
      <BattleEffect v-if="effect.effectType === 'BattleEffect'" :effect="effect as any" />
      <KingdomResourcesEffect v-if="effect.effectType === 'KingdomResourcesEffect'" :effect="effect as any" />
      <KingdomResistanceEffect v-if="effect.effectType === 'KingdomResistanceEffect'" :effect="effect as any" />
      <KingdomBuildingsEffect v-if="effect.effectType === 'KingdomBuildingsEffect'" :effect="effect as any" />
      <KingdomArmyEffect v-if="effect.effectType === 'KingdomArmyEffect'" :effect="effect as any" />
    </p>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSpellById } from 'engine/src/base/references';
import { Spell } from 'shared/types/magic';
import SummonEffect from '@/components/display/summon-effect.vue';
import BattleEffect from '@/components/display/battle-effect.vue';
import KingdomResourcesEffect from '@/components/display/kingdom-resources-effect.vue';
import KingdomResistanceEffect from '@/components/display/kingdom-resistance-effect.vue';
import KingdomBuildingsEffect from '@/components/display/kingdom-buildings-effect.vue';
import KingodmArmyEffect from '@/components/display/kingdom-army-effect.vue';

import Magic from '@/components/magic.vue';
import KingdomArmyEffect from '@/components/display/kingdom-army-effect.vue';

const props = defineProps<{ id: string }>(); 
const spell = ref<Spell|null>(null);

onMounted(() => {
  spell.value = getSpellById(props.id);
});
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  margin: 1rem 22%;
  line-height: 120%;
  gap: 5px;
}

table {
  width: 70%;
}
</style>
