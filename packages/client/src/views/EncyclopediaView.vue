<template>
  <div class="section-header">Encyclopedia</div>
  <section class="form" style="width: 20rem; margin-bottom: 10px">
    <input type="text" placeholder="search string" v-model="searchStr" /> 
    <div> Showing {{ filteredSpells.length }} of {{ spells.length}} spells.</div>
  </section>

  <table>
    <tbody>
      <tr v-for="spell of filteredSpells"> 
        <td>
          <div class="row">
            <magic :magic="spell.magic" small />

            <router-link :to="{ name: 'viewSpell', params: { id: spell.id }}"> 
              <div>{{ readableStr(spell.id) }}</div>
            </router-link>
          </div>
        </td>
        <td>
          <div>{{ spell.rank }} </div>
        </td>
        <td>
          <div>{{ spell.attributes.map(readableStr).join(', ') }} </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import Magic from '@/components/magic.vue';
import { getAllSpells } from 'engine/src/base/references';
import { Spell } from 'shared/types/magic';
import { readableStr } from '@/util/util';

const spells = ref<Spell[]>([]);
const searchStr = ref('');

const filteredSpells = computed(() => {
  const f = searchStr.value ? searchStr.value.toLowerCase() : '';
  return spells.value.filter(d => {
    return d.name.toLowerCase().includes(f)
  });
});

onMounted(() => {
  spells.value = getAllSpells();
});

</script>
