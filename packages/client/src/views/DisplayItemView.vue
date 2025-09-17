<template>
  <h2 v-if="item" class="row">
    <magic :magic="'plain'" /> {{ item.name }}
  </h2>

  <main v-if="item">
    <p style="margin: 1rem 1rem">{{ item.description }} </p>
    <table style="margin-bottom: 25px">
      <tbody>
        <tr>
          <td> Atrributes </td>
          <td> {{ item.attributes.join(",&nbsp;") }} </td>
        </tr>
        <tr v-if="item.upkeep">
          <td> Upkeep </td>
          <td>
            <div> {{ item.upkeep.geld }} geld </div>
            <div> {{ item.upkeep.mana }} mana</div>
            <div> {{ item.upkeep.population }} population</div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-for="(effect, idx) in item.effects" :key="idx" style="margin-bottom: 10px">
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

  </main>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Item } from 'shared/types/magic';
import { getItemById } from 'engine/src/base/references';
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

const item = ref<Item|null>(null);
onMounted(() => {
  item.value = getItemById(props.id);
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

