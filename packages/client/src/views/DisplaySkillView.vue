<template>
  <main>
    <h2 v-if="skill" class="row">
      <magic :magic="skill.magic" /> {{ skill.name }}
    </h2>
    <section v-if="skill">
      <p style="margin: 1rem 1rem">{{ skill.description }} </p>

      <div v-for="(effect, idx) in skill.effects" :key="idx" style="margin-bottom: 10px">
        <SummonEffect v-if="effect.effectType === 'UnitSummonEffect'" :effect="effect as any" />
        <BattleEffect v-if="effect.effectType === 'BattleEffect'" :effect="effect as any" />
        <BattleEffect v-if="effect.effectType === 'PrebattleEffect'" :effect="effect as any" />

        <KingdomResourcesEffect v-if="effect.effectType === 'KingdomResourcesEffect'" :effect="effect as any" />
        <KingdomResistanceEffect v-if="effect.effectType === 'KingdomResistanceEffect'" :effect="effect as any" />
        <KingdomBuildingsEffect v-if="effect.effectType === 'KingdomBuildingsEffect'" :effect="effect as any" />
        <KingdomArmyEffect v-if="effect.effectType === 'KingdomArmyEffect'" :effect="effect as any" />
        <ArmyUpkeepEffect v-if="effect.effectType === 'ArmyUpkeepEffect'" :effect="effect as any" />
        <ProductionEffect v-if="effect.effectType === 'ProductionEffect'" :effect="effect as any" />
        <WishEffect v-if="effect.effectType === 'WishEffect'" :effect="effect as any" />
        <StealEffect v-if="effect.effectType === 'StealEffect'" :effect="effect as any" />
      </div>
    </section>


  </main>
</template>

<script setup lang="ts">
import { getSkillById } from 'engine/src/base/references';
import { Skill } from 'shared/types/skills';
import { onMounted, ref } from 'vue';
import Magic from '@/components/magic.vue';
import SummonEffect from '@/components/display/summon-effect.vue';
import BattleEffect from '@/components/display/battle-effect.vue';
import KingdomResourcesEffect from '@/components/display/kingdom-resources-effect.vue';
import KingdomResistanceEffect from '@/components/display/kingdom-resistance-effect.vue';
import KingdomBuildingsEffect from '@/components/display/kingdom-buildings-effect.vue';
import KingdomArmyEffect from '@/components/display/kingdom-army-effect.vue';
import ArmyUpkeepEffect from '@/components/display/army-upkeep-effect.vue';
import ProductionEffect from '@/components/display/production-effect.vue';
import WishEffect from '@/components/display/wish-effect.vue';
import StealEffect from '@/components/display/steal-effect.vue';


const props = defineProps<{ id: string }>(); 

const skill = ref<Skill | undefined>(undefined);
onMounted(() => {
  skill.value = getSkillById(props.id);
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

