<template>
  <main class="about" v-if="mageStore.mage">
    <h2>Kingdom {{ mageStore.mage.name }} (# {{mageStore.mage.id}})</h2>
    <br>
    <br>
    <section>
      <div class="row">
        <div>Land</div><div>{{ totalLand(mageStore.mage) }} </div>
      </div>
      <div class="row">
        <div>Fortress</div><div>{{ mageStore.mage.fortresses }} </div>
      </div>
      <div class="row">
        <div>Geld</div><div>{{ mageStore.mage.currentGeld }} </div>
      </div>
      <div class="row">
        <div>Population</div><div>{{ mageStore.mage.currentPopulation}} / {{ interior.maxPopulation(mageStore.mage) }}</div>
      </div>
      <div class="row">
        <div>Magic</div><div>{{ mageStore.mage.currentMana}} / {{ manaStorage(mageStore.mage) }}</div>
      </div>
      <div class="row">
        <div>Items</div><div>0</div>
      </div>
    </section>

    <router-link to="/battle">Battle</router-link>
    <router-link to="/spell">Spells</router-link>
    <router-link to="/rankList">Ranks</router-link>
    <router-link to="/status">Status Report</router-link>
    <router-link to="/interior">Interior</router-link>
    <div> 
      <router-link to="/build">Building</router-link> 
      <span class="spacer"/>
      <router-link to="/destroy">Destroy</router-link> 
    </div>
    <div> 
      <!--
      <router-link to="/build">Recruit</router-link> 
      <span class="spacer"/>
      <router-link to="/destroy">Disband</router-link> 
      -->
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
const mageStore = useMageStore();

</script>

<style scoped>

section {
  border: 1px solid #DDD;
  padding: 5px;
}

.spacer {
  margin: 0 0.75rem;
}
.spacer::before {
  content: '|'
}

.row {
  display: flex;
  flex-direction: row;
  width: 18vw;
  justify-content: space-between;
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
