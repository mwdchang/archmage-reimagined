<template>
  <h2 v-if="spell">{{spell.name}}</h2>
  <main v-if="spell">
    <p style="margin: 1rem 10rem; line-height: 120%">{{ spell.description }} </p>
    <p> Rank: {{ spell.rank }} </p>
    <p> Casting cost: {{ spell.castingCost }} </p>
    <p> Casting turn: {{ spell.castingTurn }} </p>
    <p> Attributes: {{ spell.attributes.join(', ') }} </p>
    <p> Research cost: {{ spell.researchCost }} </p>
    <p v-if="spell.upkeep">
      Upkeep: {{ spell.upkeep.geld }} geld, {{ spell.upkeep.mana }} mana, {{ spell.upkeep.population }} population.
    </p>
    <p v-for="(effect, idx) in spell.effects" :key="idx">
      <SummonEffect v-if="effect.effectType === 'UnitSummonEffect'" :effect="effect as any" />
      <BattleEffect v-if="effect.effectType === 'BattleEffect'" :effect="effect as any" />
    </p>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSpellById } from 'engine/src/base/references';
import { Spell } from 'shared/types/magic';
import SummonEffect from '@/components/summon-effect.vue';
import BattleEffect from '@/components/battle-effect.vue';


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
  align-items: center;
}
</style>
