<template>
  <table v-if="mageStore.mage" class="header-info">
    <tbody>
      <!--
      <tr style="background: #338">
        <td colspan="3">
          Archmage Reimagined is in early stages of development, if you want to help out please
          <a target="_blank" href="https://github.com/mwdchang/archmage-reimagined"> visit here. </a>
        </td>
      </tr>
      -->
      <tr>
        <td> Turns {{ mageStore.mage.currentTurn }} / {{ mageStore.mage.maxTurn }} </td>
        <td> Land {{ totalLand(mageStore.mage) }} </td>
        <td> Mana {{ mageStore.mage.currentMana }} / {{ manaStorage(mageStore.mage) }} </td>
      </tr>
      <tr>
        <td> Geld {{ mageStore.mage.currentGeld }} </td>
        <td> Pop. {{ mageStore.mage.currentPopulation }} / {{ interior.maxPopulation(mageStore.mage) }}</td>
        <td> &nbsp; </td>
      </tr>
      <tr>
        <td colspan="5"> 
          <span style="display: flex; align-items: center;">Enchants &nbsp;
          <span v-for="(enchant, idx) of mageStore.mage.enchantments" :key="idx" alt="abcdefg">
            <magic :magic="enchant.spellMagic" small />
          </span>
          </span>
        </td>
      </tr>
    </tbody>
  </table>
  <br>
</template>

<script setup lang="ts">
import { useMageStore } from '@/stores/mage';
import * as interior from 'engine/src/interior';
import { totalLand } from 'engine/src/base/mage';
import { manaStorage } from 'engine/src/magic';
import magic from './magic.vue';
const mageStore = useMageStore();
</script>

<style scoped>
.header-info {
  width: 60vw;
  font-size: 80%;
}

table > tbody > tr > td {
  padding: 0px;
  padding-left: 2px;
  line-height: 1.25rem;
  width: 20%;
}
</style>
